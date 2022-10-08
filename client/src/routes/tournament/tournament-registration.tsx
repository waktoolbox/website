import {Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography} from "@mui/material";
import {Trans, useTranslation} from "react-i18next";
import React, {ChangeEvent, useContext, useEffect, useState} from "react";
import {TournamentTeamModel} from "../../../../common/tournament/tournament-models";
import {PlayerPicker} from "../../components/player-picker";
import {validateTournamentTeam} from "../../utils/tournament-validator";
import {SocketContext} from "../../context/socket-context";
import {useNavigate, useParams} from "react-router-dom";

interface RegistrationPlayer {
    id?: string,
    username?: string,
    discriminator?: string,
    locked: boolean,
    verified: boolean
}

export default function TournamentRegistration() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id, teamId} = useParams();
    const [pickedServer, setPickedServer] = useState('')
    const [team, setTeam] = useState<TournamentTeamModel>({
        tournament: id,
        catchPhrase: "",
        name: "",
        server: ""
    } as TournamentTeamModel);
    const [errors, setErrors] = useState<string[]>();
    const [players, setPlayers] = useState<RegistrationPlayer[]>([]);
    const [isStarted, setIsStarted] = useState(true);
    const socket = useContext(SocketContext);

    useEffect(() => {
        const me = localStorage.getItem("discordId");
        if (!teamId) {
            socket.emit('account::findById', me, (account: any) => {
                if (!account) return console.error("Unable to find local account --'");
                setPlayers([{
                    id: me || "",
                    username: account.username,
                    discriminator: account.discriminator,
                    locked: true,
                    verified: true
                }])
            });
        } else {
            socket.emit('tournament::getMyTeam', id, (myTeam: TournamentTeamModel) => {
                setTeam(myTeam)
                setPickedServer(servers.indexOf(myTeam.server) as any);

                socket.emit('account::findByIds', myTeam.players, (results: any[]) => {
                    if (!results) return;

                    const sort = results.map(result => ({
                        id: result?.id || "",
                        username: result?.username,
                        discriminator: result?.discriminator,
                        locked: result.id === me,
                        verified: result?.id !== undefined
                    })).sort((a, b) => a.locked ? -1 : 0) as RegistrationPlayer[];

                    setPlayers(sort);
                })
            })
        }

        socket.emit('tournament::isTournamentStarted', id, (result: boolean) => setIsStarted(result))
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const servers = ["Pandora", "Rubilax"];

    const setServer = (newServer: string) => {
        setPickedServer(newServer)
        setTeam({
            ...team,
            server: servers[newServer as any]
        })
        setErrors(validateTournamentTeam({
            ...team,
            server: servers[newServer as any]
        }));
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTeam({
            ...team,
            [event.target.id]: event.target.value
        })
        setErrors(validateTournamentTeam({
            ...team,
            [event.target.id]: event.target.value
        }));
    }

    const handlerPlayerChange = (index: number, player: RegistrationPlayer | undefined) => {
        const tmp = player ? [...players] : players.filter((p, i) => i !== index);
        if (player) {
            if (players.filter(p => p.id === player.id).length <= 0) {
                tmp[index] = player
            } else {
                tmp[index] = {
                    ...player,
                    id: undefined,
                    discriminator: "",
                    verified: false
                }
            }
        }

        setPlayers(tmp)
        setErrors(validateTournamentTeam({
            ...team,
            players: tmp.map(p => p.id) as string[]
        }));
    }

    const addPlayer = () => {
        setPlayers([
            ...players,
            {
                id: undefined,
                username: "",
                discriminator: "",
                locked: false,
                verified: false
            }
        ])
    }

    const registerTeam = () => {
        const toSend = {...team}
        toSend.players = players.map(p => p.id) as string[];

        socket.emit('tournament::registerTeam', teamId, toSend, (teamId: string) => {
            navigate(`/tournament/${id}/register/${teamId}`);
        });
    }

    const deleteTeam = () => {
        socket.emit('tournament::deleteMyTeam', id, teamId, (success: boolean) => {
            if (success) navigate(`/tournament/${id}`);
        })
    }

    return (
        <Grid container>
            <Grid item xs={12} sx={{
                backgroundColor: '#162834',
                height: '150px',
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <Typography variant="h3"><Trans i18nKey="tournament.team.registration.title"
                                                components={{span: <span className="blueWord"/>}}/></Typography>
            </Grid>
            <Grid container sx={{margin: 'auto'}}>
                <Grid item md={5} sx={{mt: 3, pr: 2, justifyContent: "flex-end"}} display={{xs: 'none', md: 'flex'}}>
                    <img src="/images/osamodas_registration.jpg" alt="Osamodas"/>
                </Grid>
                <Grid item xs={12} md={7} sx={{height: '100%', mt: 3, textAlign: "left"}}>
                    <Typography variant="h4" sx={{mb: 2, ml: 3}}><Trans i18nKey="tournament.team.registration.subtitle"
                                                                        components={{
                                                                            span: <span className="blueWord"/>
                                                                        }}/></Typography>

                    <Grid container>
                        <Grid xs={12}>
                            <TextField sx={{width: '600px', m: 1}} label={t('tournament.team.registration.name')}
                                       id="name"
                                       value={team.name} disabled={isStarted}
                                       onChange={handleChange}/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                sx={{width: '600px', m: 1}}
                                value={pickedServer}
                                label={t('tournament.team.registration.server')}
                                select
                            >
                                {Object.keys(servers).map((server) => (
                                    <MenuItem sx={{
                                        backgroundColor: '#213a41',
                                        ':hover': {
                                            backgroundColor: '#1f333a'
                                        },
                                        '&.Mui-selected': {backgroundColor: '#1f333a', fontWeight: 'bold'},
                                        '&.Mui-selected:hover': {backgroundColor: '#1f333a'}
                                    }}
                                              key={server}
                                              onClick={() => setServer(server)}
                                              value={server}
                                    >
                                        {servers[server as any]}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid xs={12}>
                            <TextField sx={{width: '600px', m: 1}} label={t('tournament.team.registration.catchPhrase')}
                                       id="catchPhrase" value={team.catchPhrase}
                                       onChange={handleChange}/>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid xs={12} sx={{width: 'fit-content', mt: 3}}>
                    <Card sx={{width: 'fit-content', margin: "auto"}}>
                        <CardContent>
                            <Typography variant="h6" sx={{textAlign: 'left', mb: 2}}><Trans
                                i18nKey="tournament.team.registration.addPlayerToTeam"
                                components={{span: <span className="blueWord"/>}}/></Typography>

                            <Stack spacing={1}>
                                {players && players.map((player, index) => (
                                    <PlayerPicker key={index} userData={player} disabled={isStarted}
                                                  setUserData={(data) => handlerPlayerChange(index, data)}/>

                                ))}
                            </Stack>
                            <Button disabled={isStarted} sx={{mt: 2, width: "100%", backgroundColor: "#017d7f"}}
                                    onClick={addPlayer}>{t('tournament.team.registration.addPlayer')}</Button>
                        </CardContent>
                    </Card>

                    <Button onClick={registerTeam}
                            sx={{
                                mt: 2, backgroundColor: "#006400", color: "#fefdff", maxWidth: "680px", width: "100%",
                                '&.Mui-disabled': {
                                    backgroundColor: "rgba(74,124,177,0.2)",
                                    color: '#fefdff'
                                }
                            }}
                            disabled={(errors && errors.length > 0) || !team.name}>{t(teamId ? "modify" : "tournament.team.registration.register")}
                    </Button>
                    <br/>
                    {teamId &&
                        <Button sx={{mt: 2, maxWidth: "680px", width: "100%", backgroundColor: "#4a7cb1"}}
                                onClick={() => navigator.clipboard.writeText(`${window.location}/validate`)}>{t('tournament.team.registration.copyValidationLink')}</Button>
                    }
                    <br/>
                    {teamId &&
                        <Button sx={{mt: 2, maxWidth: "680px", width: "100%"}} color="error"
                                onClick={deleteTeam}>{t('delete')}</Button>
                    }
                </Grid>
                <Grid xs={12} sx={{mt: 1}}>
                    {errors && errors.length > 0 && errors.map(error => (
                        <Typography key={error}>{t(error)}</Typography>
                    ))}
                </Grid>
            </Grid>

        </Grid>
    )
}