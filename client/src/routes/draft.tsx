import {Button, Grid, Stack, Typography} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {Trans, useTranslation} from "react-i18next";
import React, {useContext, useEffect, useState} from "react";
import {SocketContext} from "../context/socket-context";
import {
    DraftAction,
    DraftActionType,
    DraftConfiguration,
    DraftController,
    DraftData,
    DraftNotifier,
    DraftTeam,
    DraftUser,
    DraftValidator
} from "../utils/draft-controller";
import {DraftTemplates} from "../utils/draft-templates";
import {Breeds, BreedsArray} from "../utils/breeds";

type BreedStatus = {
    id: number;
    locked: boolean;
}

class ClientDraftController implements DraftController<DraftConfiguration, DraftNotifier, DraftValidator>, DraftNotifier, DraftValidator {
    notifier: DraftNotifier = this;
    validator: DraftValidator = this;
    data: DraftData;

    private lockedForTeamA: number[] = [];
    private lockedForTeamB: number[] = [];
    private pickedByTeamA: number[] = [];
    private pickedByTeamB: number[] = [];

    constructor(data: DraftData) {
        this.data = data;
    }

    init(configuration: DraftConfiguration): void {

    }

    onAction(action: DraftAction): boolean {
        this.lock(action);
        if (action.team === DraftTeam.TEAM_A && action.type === DraftActionType.PICK) this.pickedByTeamA.push(action.breed as number);
        else if (action.team === DraftTeam.TEAM_B && action.type === DraftActionType.PICK) this.pickedByTeamB.push(action.breed as number);

        this.data.currentAction++;
        return true;
    }

    getCurrentAction(): DraftAction {
        return this.data.configuration.actions[this.data.currentAction];
    }

    getSelectionState(): BreedStatus[] {
        const currentAction = this.data.configuration.actions[this.data.currentAction];
        const breedLock = currentAction.team === DraftTeam.TEAM_A ? this.lockedForTeamA : this.lockedForTeamB;

        return BreedsArray.map(b => {
            return {
                id: b as number,
                locked: breedLock.includes(b as number)
            }
        });
    }

    restore(): void {
        this.data.history.forEach(action => {
            this.onAction(action);
        })
    }

    private lock(action: DraftAction) {
        if (action.lockForPickingTeam) {
            if (action.team === DraftTeam.TEAM_A) this.lockedForTeamA.push(action.breed as number)
            else if (action.team === DraftTeam.TEAM_B) this.lockedForTeamB.push(action.breed as number)
        }
        if (action.lockForOpponentTeam) {
            if (action.team === DraftTeam.TEAM_A) this.lockedForTeamB.push(action.breed as number)
            else if (action.team === DraftTeam.TEAM_B) this.lockedForTeamA.push(action.breed as number)
        }
    }

    onUserAssigned(player: DraftUser, team: DraftTeam): void {
        if (team === DraftTeam.TEAM_A) {
            const existingPlayer = this.data?.teamA?.find(u => u.id === player.id);
            if (existingPlayer) {
                // TODO draft fill
                return;
            }
            this.data?.teamA?.push(player);
        }
        if (team === DraftTeam.TEAM_B) {
            const existingPlayer = this.data?.teamB?.find(u => u.id === player.id);
            if (existingPlayer) {
                // TODO draft fill
                return;
            }
            this.data?.teamB?.push(player);
        }
    }

    onUserJoin(user: DraftUser): void {
        this.data.users.push(user);
    }

    onTeamReady(team: DraftTeam, ready: boolean) {
        if (team === DraftTeam.TEAM_A) this.data.teamAReady = ready;
        if (team === DraftTeam.TEAM_B) this.data.teamBReady = ready;
    }

    areTeamReady(): boolean {
        if (!this.data.teamAReady || !this.data.teamBReady) return false;
        return this.data.teamAReady && this.data.teamBReady;
    }

    getUserTeam(id: string): DraftTeam | undefined {
        if (this.data?.teamA?.find(u => u.id === id)) return DraftTeam.TEAM_A;
        if (this.data?.teamB?.find(u => u.id === id)) return DraftTeam.TEAM_B;
        return undefined;
    }

    isTeamReady(team?: DraftTeam): boolean {
        if (!team) return false;
        if (team === DraftTeam.TEAM_A) return this.data.teamAReady || false;
        if (team === DraftTeam.TEAM_B) return this.data.teamBReady || false;
        return false;
    }

    isClassLockedForCurrentAction(breed: Breeds): boolean {
        if (!breed) return true;
        const currentAction = this.getCurrentAction();
        if (!currentAction) return true;
        if (currentAction.team === DraftTeam.TEAM_A) return this.lockedForTeamA.includes(breed);
        if (currentAction.team === DraftTeam.TEAM_B) return this.lockedForTeamB.includes(breed);
        return true;
    }


    validate(action: DraftAction, user: string): boolean {
        // TODO draft validation
        return true;
    }

}

let controller: ClientDraftController | undefined;

export default function Draft() {
    const {id} = useParams();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const socket = useContext(SocketContext)

    const [draftData, setDraftData] = useState<DraftData>()
    const [teamA, setTeamA] = useState<DraftUser[]>([]);
    const [teamB, setTeamB] = useState<DraftUser[]>([]);
    const [currentSelectionState, setCurrentSelectionState] = useState<BreedStatus[]>([]);
    const [currentAction, setCurrentAction] = useState<DraftAction>();
    const [teamReady, setTeamReady] = useState<boolean>(false);
    const [myTeamReady, setMyTeamReady] = useState<boolean>(false);
    const [imDraftLeader, setImDraftLeader] = useState<boolean>(false);
    const [endReason, setEndReason] = useState<string>();
    const [myTeam, setMyTeam] = useState<DraftTeam | number>();
    const [usersToAssign, setUsersToAssign] = useState<DraftUser[]>();
    const [pickedBreed, setPickedBreed] = useState<Breeds | undefined>(undefined);
    const [hoveredBreed, setHoveredBreed] = useState<Breeds | undefined>(undefined);

    const onTeamReady = (team: DraftTeam, ready: boolean) => {
        if (!controller) return;
        controller.onTeamReady(team, ready);
        setTeamReady(controller.areTeamReady())
        const myId = controller.getUserTeam(localStorage.getItem("discordId") || "") || controller.getUserTeam(socket.id);
        setMyTeamReady(controller.isTeamReady(myId))

        if (controller.areTeamReady()) {
            setUsersToAssign(undefined)
        }
        setDraftData(controller.data)
    }

    const onAction = (action: DraftAction) => {
        if (!controller) return;
        controller.onAction(action);
        setCurrentAction(controller.getCurrentAction())
        setCurrentSelectionState(controller.getSelectionState());
        setDraftData(controller?.data)
    };

    const onUserJoined = (user: DraftUser) => {
        if (!controller) return;
        if (controller.areTeamReady()) return;
        controller.onUserJoin(user);

        if (!controller.areTeamReady()) {
            setUsersToAssign(computeUsersToAssign())
        }

        // TODO draft refresh if same team
        setDraftData(controller.data)
    }

    const onUserAssigned = (user: DraftUser, team: DraftTeam) => {
        if (!controller) return;
        controller.onUserAssigned(user, team);
        if (team === DraftTeam.TEAM_A) setTeamA(controller.data.teamA || [])
        if (team === DraftTeam.TEAM_B) setTeamB(controller.data.teamB || [])
        if (user.id === localStorage.getItem("discordId") || user.id === socket.id) {
            setMyTeam(team);
        }
        setDraftData(controller.data)
    }

    const onCreatorDisconnected = () => {
        setEndReason("draft.creatorDisconnected");
        setDraftData(controller?.data)
    }

    useEffect(() => {
        if (!id) return;

        socket.emit('draft::getById', id, (draft: DraftData) => {
            if (!draft) {
                return navigate("/draft");
            }
            controller = new ClientDraftController(draft);
            controller.restore();
            setDraftData(draft);
            setUsersToAssign(computeUsersToAssign());
            setTeamA(controller.data.teamA || []);
            setTeamB(controller.data.teamB || []);
            setCurrentSelectionState(controller.getSelectionState());
            setCurrentAction(controller.getCurrentAction());
            setTeamReady(controller.areTeamReady());

            socket.on('draft::teamReady', onTeamReady);
            socket.on("draft::action", onAction);
            socket.on('draft::userJoined', onUserJoined);
            socket.on('draft::userAssigned', onUserAssigned);
            socket.on('draft::creatorDisconnected', onCreatorDisconnected);
        });

        return () => {
            socket.off("draft::teamReady", onTeamReady);
            socket.off("draft::action", onAction);
            socket.off("draft::userJoined", onUserJoined);
            socket.off("draft::userAssigned", onUserAssigned);
            socket.off("draft::creatorDisconnected", onCreatorDisconnected);
            if (id) {
                socket.emit('draft::leave', id);
            }
        }
    }, [id, socket])

    function createDraft() {
        socket.emit('draft::create', {
            configuration: {
                actions: DraftTemplates[0].actions
            }
        } as DraftData, (draftData: DraftData) => {
            setImDraftLeader(true);
            navigate(`/draft/${draftData.id}`)
        })
    }

    function computeUsersToAssign() {
        if (!controller) return [];
        return controller.data.users.filter(u => !teamA.find(a => a.id === u.id) && !teamB.find(b => b.id === u.id));
    }

    function draftTemplateAction(action: DraftAction, index: number) {
        const teamA = action.team === DraftTeam.TEAM_A;
        const teamColor = teamA ? "#07c6b6" : "#00A4E9";

        const actionName = action.type === DraftActionType.PICK ? "draft.pick" : "draft.ban"
        const actionColor = action.type === DraftActionType.PICK ? "#4be64b" : "#e64b4b";

        let lockType;
        if (action.lockForPickingTeam && action.lockForOpponentTeam) lockType = "Both"
        else if (action.lockForOpponentTeam) lockType = "Opponent"
        else if (action.lockForPickingTeam) lockType = "Own"
        else lockType = "None"

        const lockText = "draft.lockFor" + lockType;
        return (
            <Typography key={index} sx={{m: 1, textAlign: "start", ml: 4}}>
                <span style={{color: teamColor}}>{t(teamA ? 'draft.teamA' : 'draft.teamB')} </span>
                <Trans i18nKey={actionName}
                       components={{span: <span style={{color: actionColor, fontWeight: "bold"}}/>}}/>
                <span> {t(lockText)}</span>
            </Typography>
        )
    }

    function draftTeam(team: DraftTeam) {
        const teamInfo = team === DraftTeam.TEAM_A ? draftData?.teamAInfo : draftData?.teamBInfo
        const teamMembers = team === DraftTeam.TEAM_A ? teamA : teamB;
        return (
            <Grid container>
                {draftData &&
                    <Grid item xs={12}>
                        <Typography>{teamInfo?.name}</Typography>
                        {teamA &&

                            <Stack>
                                {teamMembers.map(u => (
                                    <Typography key={u.id}>{u.username + "#" + u.discriminator}</Typography>
                                ))}
                            </Stack>
                        }
                    </Grid>
                }
            </Grid>
        )
    }

    return (
        <Grid container sx={{width: "90%", margin: "auto", mt: 4, mb: 4}}>
            <Grid item xs={6} lg={3} order={{xs: 2, lg: 1}}>
                {draftData && draftTeam(DraftTeam.TEAM_A)}
            </Grid>
            <Grid item xs={12} lg={6} order={{xs: 1, lg: 2}}
                  sx={{backgroundColor: "#162834", borderRadius: 3, pb: 2}}>
                {!draftData &&
                    <Grid container>
                        <Grid item xs={12}>
                            <Typography variant="h4">{t('draft.template')}</Typography>
                            <Typography variant="h5">{DraftTemplates[0].name}</Typography>
                            {DraftTemplates[0].actions.map((action, index) => (
                                draftTemplateAction(action, index)
                            ))}
                        </Grid>
                        <Grid item xs={12}>
                            <Button onClick={createDraft} sx={{width: "95%", m: 1}}>{t('draft.create')}</Button>
                        </Grid>
                    </Grid>
                }
                {teamReady && draftData &&
                    <Grid container>
                        {currentAction &&
                            <Grid item xs={12}>
                                <Typography>Action courante</Typography>
                                {draftTemplateAction(currentAction, 0)}
                            </Grid>
                        }
                        <Grid item xs={12} sx={{m: 2}}>
                            <Grid container>
                                {BreedsArray.map(breed => (
                                    <Grid item key={breed} xs={2}>
                                        <img src={`/classes/${breed}_0.png`} alt={`Breed ${breed}`}
                                             style={{width: "95%"}}
                                             className={`draftImage 
                                             ${controller?.isClassLockedForCurrentAction(breed) ? 'draftImageDisabled' : ''} 
                                             ${breed === pickedBreed ? "draftImagePicked" : ""}
                                             ${breed === hoveredBreed ? "draftImageHover" : ""}
                                             `}

                                             onMouseEnter={() => {
                                                 if (controller?.getCurrentAction().team !== myTeam) return;
                                                 setHoveredBreed(breed);
                                             }}
                                             onMouseOut={() => {
                                                 setHoveredBreed(undefined);
                                             }}
                                             onClick={() => {
                                                 if (controller?.getCurrentAction().team !== myTeam) return;
                                                 setPickedBreed(breed)
                                             }}/>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Button disabled={controller?.getCurrentAction().team !== myTeam}
                                    onClick={() => {
                                        socket.emit('draft::action', id, {
                                            ...controller?.getCurrentAction(),
                                            breed: pickedBreed
                                        })
                                        setPickedBreed(undefined);
                                        setHoveredBreed(undefined)
                                    }}>
                                {t('validate')}
                            </Button>
                        </Grid>
                    </Grid>
                }

                {!teamReady && draftData &&
                    <Grid container>
                        {imDraftLeader &&
                            <Grid item xs={12}>
                                {usersToAssign && usersToAssign.map(u => (
                                    <Stack direction="row">
                                        <Typography>{u.username + "#" + u.discriminator}</Typography>
                                        <Button
                                            onClick={() => socket.emit('draft::assignUser', id, u.id, DraftTeam.TEAM_A)}>{t('draft.assignToA')}</Button>
                                        <Button
                                            onClick={() => socket.emit('draft::assignUser', id, u.id, DraftTeam.TEAM_B)}>{t('draft.assignToB')}</Button>
                                    </Stack>
                                ))}
                            </Grid>
                        }
                        <Grid item xs={12}>
                            {!myTeamReady &&
                                <Button disabled={!myTeam}
                                        onClick={() => socket.emit('draft::teamReady', id, myTeam, true)}>{t('draft.setTeamReady')}</Button>
                            }
                            {myTeamReady &&
                                <Button disabled={!myTeam}
                                        onClick={() => socket.emit('draft::teamReady', id, myTeam, false)}>{t('draft.setTeamNotReady')}</Button>
                            }
                        </Grid>
                    </Grid>
                }
            </Grid>
            <Grid item xs={6} lg={3} order={{xs: 3, lg: 3}}>
                {draftData && draftTeam(DraftTeam.TEAM_B)}
            </Grid>
        </Grid>
    )
}