import {Button, Grid, Typography} from "@mui/material";
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
import {Variant} from "@mui/material/styles/createTypography";

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

        return true;
    }

    getCurrentAction(): DraftAction {
        return this.data.configuration.actions[this.data.currentAction];
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
            const existingPlayer = this.data.teamA?.find(u => u.id === player.id);
            if (existingPlayer) return;
            this.data?.teamA?.push(player);
        }
        if (team === DraftTeam.TEAM_B) {
            const existingPlayer = this.data.teamB?.find(u => u.id === player.id);
            if (existingPlayer) return;
            this.data?.teamB?.push(player);
        }
    }

    onUserJoin(user: DraftUser): void {
        if (this.data.users.find(u => u.id === user.id)) return;
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

    getUserFromTeam(id: string): DraftUser | undefined {
        const foundTeamA = this.data?.teamA?.find(u => u.id === id);
        if (foundTeamA) return foundTeamA;
        const foundTeamB = this.data?.teamB?.find(u => u.id === id);
        if (foundTeamB) return foundTeamB;
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
    const [teamA, setTeamA] = useState<DraftUser[]>();
    const [teamB, setTeamB] = useState<DraftUser[]>();
    const [currentAction, setCurrentAction] = useState<DraftAction>();
    const [teamReady, setTeamReady] = useState<boolean>(false);
    const [myTeamReady, setMyTeamReady] = useState<boolean>(false);
    const [imDraftLeader, setImDraftLeader] = useState<boolean>(false);
    const [endReason, setEndReason] = useState<string>();
    const [myTeam, setMyTeam] = useState<DraftTeam | number>();
    const [usersToAssign, setUsersToAssign] = useState<DraftUser[]>();
    const [pickedBreed, setPickedBreed] = useState<Breeds | undefined>(undefined);
    const [hoveredBreed, setHoveredBreed] = useState<Breeds | undefined>(undefined);

    const cleanDraft = () => {
        controller = undefined;
        setDraftData(undefined);
        setTeamA([]);
        setTeamB([]);
        setCurrentAction(undefined)
        setEndReason(undefined)
        setUsersToAssign(undefined)
        setPickedBreed(undefined)
        setHoveredBreed(undefined)
        setMyTeam(undefined)
        setTeamReady(false)
        setMyTeamReady(false)
        setImDraftLeader(false)
        navigate('/draft')
    }

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
        controller.data.history.push(action);
        controller.data.currentAction++;

        setCurrentAction(controller.getCurrentAction())

        if (!controller.getCurrentAction()) {
            setEndReason('draft.ended')
        }
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

    const onUserDisconnected = (userId: string) => {
        if (!controller) return;

        const user = controller.data.users.find(u => u.id === userId);
        if (user) user.present = false;
        const userFromTeam = controller.getUserFromTeam(userId);
        if (userFromTeam) {
            userFromTeam.present = false;
            setTeamA([...(controller?.data?.teamA || [])]);
            setTeamB([...(controller?.data?.teamB || [])]);
        }
        if (!controller.areTeamReady()) {
            setUsersToAssign(computeUsersToAssign())
        }
        setDraftData(controller.data)
    }

    const onUserAssigned = (user: DraftUser, team: DraftTeam) => {
        if (!controller) return;
        controller.onUserAssigned(user, team);
        setTeamA([...(controller?.data?.teamA || [])]);
        setTeamB([...(controller?.data?.teamB || [])]);
        setUsersToAssign(computeUsersToAssign());
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
            setTeamA([...(controller?.data?.teamA || [])]);
            setTeamB([...(controller?.data?.teamB || [])]);
            setCurrentAction(controller.getCurrentAction());
            setTeamReady(controller.areTeamReady());
            const discordId = localStorage.getItem("discordId") || "";
            setMyTeam(controller.getUserTeam(socket.id) || controller.getUserTeam(discordId))
            if (draft.configuration.leader === socket.id || draft.configuration.leader === discordId) {
                setImDraftLeader(true);
            }

            socket.on('draft::teamReady', onTeamReady);
            socket.on("draft::action", onAction);
            socket.on('draft::userJoined', onUserJoined);
            socket.on('draft::userAssigned', onUserAssigned);
            socket.on('draft::creatorDisconnected', onCreatorDisconnected);
            socket.on('draft::userDisconnected', onUserDisconnected);
        });

        return () => {
            socket.off("draft::teamReady", onTeamReady);
            socket.off("draft::action", onAction);
            socket.off("draft::userJoined", onUserJoined);
            socket.off("draft::userAssigned", onUserAssigned);
            socket.off("draft::creatorDisconnected", onCreatorDisconnected);
            socket.off("draft::userDisconnected", onUserDisconnected);
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
        if (controller.areTeamReady()) return [];
        const result: DraftUser[] = [];
        controller.data.users.forEach(user => {
            if (controller?.data?.teamA?.find(u => u.id === user.id)) return;
            if (controller?.data?.teamB?.find(u => u.id === user.id)) return;
            result.push(user);
        })
        return result;
    }

    function draftTemplateAction(action: DraftAction, index: number, textAlign: string = "start", variant: Variant = "body1") {
        const teamA = action.team === DraftTeam.TEAM_A;
        const teamColor = teamA ? "#07c6b6" : "#00A4E9";

        const actionName = action.type === DraftActionType.PICK ? "draft.pickDesc" : "draft.banDesc"
        const actionColor = action.type === DraftActionType.PICK ? "#4be64b" : "#e64b4b";

        let lockType;
        if (action.lockForPickingTeam && action.lockForOpponentTeam) lockType = "Both"
        else if (action.lockForOpponentTeam) lockType = "Opponent"
        else if (action.lockForPickingTeam) lockType = "Own"
        else lockType = "None"

        const lockText = "draft.lockFor" + lockType + "Desc";
        return (
            <Typography key={index} variant={variant} sx={{m: 1, textAlign: textAlign, ml: 4}}>
                <span style={{color: teamColor}}>{t(teamA ? 'draft.teamA' : 'draft.teamB')} </span>
                <Trans i18nKey={actionName}
                       components={{span: <span style={{color: actionColor, fontWeight: "bold"}}/>}}/>
                <span> {t(lockText)}</span>
            </Typography>
        )
    }

    function DraftTeamColumn({draftTeam, team}: { draftTeam: DraftTeam, team: DraftUser[] }) {
        return (
            <Grid container
                  sx={{
                      backgroundColor: "#162834",
                      borderRadius: 3,
                      width: "95%",
                      height: "100%",
                      margin: "auto",
                      display: "block"
                  }}>
                <Grid item xs={12} sx={{pt: 1, height: "200px"}}>
                    <Typography variant="h5"
                                sx={{mb: 2}}>{draftTeam === DraftTeam.TEAM_A ? draftData?.teamAInfo?.name : draftData?.teamBInfo?.name}</Typography>
                    {team && team.filter(u => u.present).map(u => (
                        <Typography key={u.id}>{u.username}<span
                            style={{color: "#848889"}}>{"#" + u.discriminator}</span></Typography>
                    ))}
                </Grid>
                <Grid item xs={12} sx={{p: 2}}>
                    {!teamReady && draftTeam === myTeam && !myTeamReady &&
                        <Button disabled={!myTeam} sx={{width: "90%"}}
                                onClick={() => socket.emit('draft::teamReady', id, myTeam, true)}>{t('draft.setTeamReady')}</Button>
                    }
                    {!teamReady && draftTeam === myTeam && myTeamReady &&
                        <Button disabled={!myTeam} sx={{width: "90%"}}
                                onClick={() => socket.emit('draft::teamReady', id, myTeam, false)}>{t('draft.setTeamNotReady')}</Button>
                    }
                    {draftData && draftData.history && draftData.history.length > 0 &&
                        <Grid container>
                            {draftData.history.filter(e => e.team === draftTeam).map((e, index) => (
                                <Grid item xs={3} md={2} key={index}>
                                    <img style={{
                                        width: "100%",
                                        filter: (e.type === DraftActionType.BAN ? "grayscale(1)" : "")
                                    }} src={`/classes/${e.breed}_0.png`}
                                         alt={`Breed ${e.breed}`}/>
                                    <Trans sx={{position: "relative", top: "0px", left: "0px"}}
                                           i18nKey={e.type === DraftActionType.PICK ? "draft.pick" : "draft.ban"}
                                           components={{
                                               span: <span style={{
                                                   color: e.type === DraftActionType.PICK ? "#4be64b" : "#e64b4b",
                                                   fontWeight: "bold"
                                               }}/>
                                           }}/>
                                </Grid>
                            ))}
                        </Grid>
                    }
                </Grid>
            </Grid>
        )
    }

    return (
        <Grid container sx={{width: "90%", margin: "auto", mt: 4, mb: 4}}>
            <Grid item xs={6} lg={3} order={{xs: 2, lg: 1}} sx={{pb: 2}}>
                {teamA && <DraftTeamColumn draftTeam={DraftTeam.TEAM_A} team={teamA}/>}
            </Grid>
            <Grid item xs={6} lg={3} order={{xs: 3, lg: 3}} sx={{pb: 2}}>
                {teamB && <DraftTeamColumn draftTeam={DraftTeam.TEAM_B} team={teamB}/>}
            </Grid>
            {(imDraftLeader || teamReady || !id || endReason) &&
                <Grid item xs={12} lg={6} order={{xs: 1, lg: 2}}
                      sx={{backgroundColor: "#162834", borderRadius: 3, pb: 2, mb: 2}}>
                    {!draftData && !id &&
                        <Grid container>
                            <Grid item xs={12} sx={{mt: 1}}>
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
                                <Grid item xs={12} sx={{mt: 1}}>
                                    <Typography variant="h5">{t('draft.currentAction')}</Typography>
                                    {draftTemplateAction(currentAction, 0, "center", "h6")}
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
                            {myTeam && !endReason &&
                                <Grid item xs={12}>
                                    <Button disabled={controller?.getCurrentAction()?.team !== myTeam}
                                            sx={{width: "95%"}}
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
                            }

                        </Grid>
                    }

                    {endReason &&
                        <Grid item xs={12} sx={{mt: 2}}>
                            <Button onClick={cleanDraft}>{t(endReason)}</Button>
                        </Grid>
                    }

                    {!teamReady && draftData &&
                        <Grid container>
                            {imDraftLeader &&
                                <Grid item xs={12}>
                                    <Grid container>
                                        {usersToAssign && usersToAssign.map(u => (
                                            <Grid key={u.id} item xs={12} sx={{mt: 2}}>
                                                <Grid container alignItems="center">
                                                    <Grid item xs={4}>
                                                        <Typography>{u.username + "#" + u.discriminator}</Typography>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Button
                                                            onClick={() => socket.emit('draft::assignUser', id, u.id, DraftTeam.TEAM_A)}>{t('draft.assignToA')}</Button>
                                                    </Grid>
                                                    <Grid item xs={4}>
                                                        <Button
                                                            onClick={() => socket.emit('draft::assignUser', id, u.id, DraftTeam.TEAM_B)}>{t('draft.assignToB')}</Button>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {(!usersToAssign || usersToAssign.length <= 0) &&
                                        <Typography sx={{mt: 2}} variant="h5">{t('draft.noUserToAssign')}</Typography>
                                    }
                                </Grid>
                            }
                        </Grid>
                    }
                </Grid>
            }
        </Grid>
    )
}