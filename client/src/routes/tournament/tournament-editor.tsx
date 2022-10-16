import {Link, useNavigate, useParams} from "react-router-dom";
import {ChangeEvent, SyntheticEvent, useContext, useEffect, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import Box from "@mui/material/Box";
import {
    Button,
    Grid,
    Stack,
    Tab,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import {useTranslation} from "react-i18next";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {TournamentDefinition, TournamentTeamModel} from "../../utils/tournament-models";
import {validateTournamentDefinition} from "../../utils/tournament-validator";
import {PlayerPicker} from "../../components/player-picker";
import DeleteIcon from "@mui/icons-material/Delete";

export default function TournamentEditor() {
    const {id} = useParams();
    const socket = useContext(SocketContext)
    const {t} = useTranslation();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<TournamentDefinition>({
        id: "",
        name: "",
        level: 230,
        description: "",
        rewards: "",
        rules: "",
        teamNumber: 10,
        teamSize: ""
    } as TournamentDefinition);
    const [changes, setChanges] = useState<any>({})
    const [errors, setErrors] = useState<any>([])
    const [tab, setTab] = useState(0);
    const [teams, setTeams] = useState<TournamentTeamModel[]>()
    const [accounts, setAccounts] = useState<any[]>();

    const [newAdmin, setNewAdmin] = useState({username: "", discriminator: "", locked: false, verified: false});
    const [newReferee, setNewReferee] = useState({username: "", discriminator: "", locked: false, verified: false});
    const [newStreamer, setNewStreamer] = useState({
        username: "",
        discriminator: "",
        locked: false,
        verified: false
    });

    useEffect(() => {
        if (id) {
            socket.emit('tournament::get', id, ((t: TournamentDefinition) => {
                setTournament(t);
            }));
        } else {
            setTournament({} as TournamentDefinition)
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (event: SyntheticEvent, newValue: number) => {
        setTab(newValue);
        switch (newValue) {
            case 2:
                return onUsersOpen();
            case 3:
                return onTeamsOpen();
        }
    };

    const handleTournamentChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTournament({
            ...tournament,
            [event.target.id]: event.target.value
        } as TournamentDefinition)
        setChanges({
            ...changes,
            [event.target.id]: event.target.value
        });
        setErrors(validateTournamentDefinition({
            ...tournament,
            ...changes,
            [event.target.id]: event.target.value
        } as TournamentDefinition, Date.now()));
    }

    const handleTournamentDateChange = (field: string, newValue: string | null | undefined, ignored?: string | undefined) => {
        setTournament({
            ...tournament,
            [field]: newValue || undefined
        } as TournamentDefinition)
        setChanges({
            ...changes,
            [field]: newValue
        });
        setErrors(validateTournamentDefinition({
            ...tournament,
            ...changes,
            [field]: newValue
        } as TournamentDefinition, Date.now()));
    }

    const commitBaseInformationChange = () => {
        socket.emit("tournament::setBaseInformation", tournament?.id || undefined, {...tournament, ...changes}, (result: TournamentDefinition) => {
            if (result && result.id) {
                navigate(`/edit-tournament/${result.id}`)
            }
        });
    }

    const onUsersOpen = () => {
        socket.emit('account::findByIds', [...tournament.admins, ...tournament.referees, ...tournament.streamers], (t: any[]) => {
            setAccounts(t);
        });
    }

    const onTeamsOpen = () => {
        socket.emit('tournament::admin:getAllTeams', tournament?.id, (t: any[]) => {
            setTeams(t.map((te: any) => te.content));
        });
    }

    const removeAdmin = (index: number) => {
        socket.emit('tournament::admin:removeAdmin', tournament.id, tournament.admins[index], (success: boolean) => {
            if (success) setTournament({
                ...tournament,
                admins: tournament.admins.filter((a, i) => index !== i)
            })
        })
    }

    const handleNewAdmin = (data: any) => {
        socket.emit('tournament::admin:addAdmin', tournament.id, data.id, (success: boolean) => {
            if (success) {
                setTournament({
                    ...tournament,
                    admins: [...tournament.admins, data.id]
                })
                setAccounts([...accounts as any[], data])
            } else {
                setNewAdmin({username: data.username || "", discriminator: "", locked: false, verified: false})
            }
        })
    }

    const removeReferee = (index: number) => {
        socket.emit('tournament::admin:removeReferee', tournament.id, tournament.referees[index], (success: boolean) => {
            if (success) setTournament({
                ...tournament,
                referees: tournament.referees.filter((a, i) => index !== i)
            })
        })
    }

    const handleNewReferee = (data: any) => {
        socket.emit('tournament::admin:addReferee', tournament.id, data.id, (success: boolean) => {
            if (success) {
                setTournament({
                    ...tournament,
                    referees: [...tournament.referees, data.id]
                })
                setAccounts([...accounts as any[], data])
            } else {
                setNewReferee({username: data.username || "", discriminator: "", locked: false, verified: false})
            }
        })
    }

    const removeStreamer = (index: number) => {
        socket.emit('tournament::admin:removeStreamer', tournament.id, tournament.streamers[index], (success: boolean) => {
            if (success) setTournament({
                ...tournament,
                streamers: tournament.streamers.filter((a, i) => index !== i)
            })
        })
    }

    const handleNewStreamer = (data: any) => {
        socket.emit('tournament::admin:addStreamer', tournament.id, data.id, (success: boolean) => {
            if (!success) return;
            setTournament({
                ...tournament,
                streamers: [...tournament.streamers, data.id]
            })
            setNewStreamer({username: "", discriminator: "", locked: false, verified: false})
        })
    }

    const deleteTeam = (id: string) => {
        socket.emit('tournament::admin::deleteTeam', tournament?.id, id, () => onTeamsOpen())
    }

    return (
        <div>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={tab} onChange={handleTabChange} aria-label="basic tabs example">
                    <Tab label={t('tournament.editor.information.general')}/>
                    <Tab label={t('tournament.editor.information.phases')}/>
                    <Tab label={t('tournament.editor.information.users')}/>
                    <Tab label={t('tournament.editor.information.teams')}/>
                </Tabs>
            </Box>
            <div
                role="tabpanel"
                hidden={tab !== 0}
                id={`simple-tabpanel-0`}
                aria-labelledby={`simple-tab-0`}
            >
                {tab === 0 && (
                    <Box sx={{p: 3}}>
                        <TextField id="id" label={t('tournament.id')} value={tournament?.id} disabled
                                   onChange={handleTournamentChange}/>
                        <TextField id="name" label={t('tournament.name')} value={tournament?.name}
                                   onChange={handleTournamentChange}/>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DateTimePicker
                                label={t('tournament.startDate')}
                                value={tournament?.startDate}
                                onChange={(value, ignored) => handleTournamentDateChange("startDate", value, ignored)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <DateTimePicker
                                label={t('tournament.endDate')}
                                value={tournament?.endDate}
                                onChange={(value, ignored) => handleTournamentDateChange("endDate", value, ignored)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <TextField id="level" label={t('tournament.level')} value={tournament?.level} type="number"
                                   onChange={handleTournamentChange}/>
                        <TextField id="description" label={t('tournament.description')} value={tournament?.description}
                                   onChange={handleTournamentChange}/>
                        <TextField id="rewards" label={t('tournament.rewards')} value={tournament?.rewards}
                                   onChange={handleTournamentChange}/>
                        <TextField id="rules" label={t('tournament.rules')} value={tournament?.rules}
                                   onChange={handleTournamentChange}/>
                        <TextField id="teamNumber" label={t('tournament.teamNumber')} value={tournament?.teamNumber}
                                   type="number" onChange={handleTournamentChange}/>
                        <TextField id="teamSize" label={t('tournament.teamSize')} value={tournament?.teamSize}
                                   onChange={handleTournamentChange}/>

                        <Button variant="contained" color="success" onClick={commitBaseInformationChange}
                                disabled={Object.keys(changes).length <= 0 || (errors && errors.length > 0)}>{t('send')}</Button>

                        {
                            errors && errors.length > 0 && errors.map((error: string) => (
                                <p key={error}>{t(error)}</p>
                            ))
                        }
                    </Box>
                )}
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 1}
                id={`simple-tabpanel-1`}
                aria-labelledby={`simple-tab-1`}
            >
                {tab === 1 && (
                    <Box sx={{p: 3}}>
                        <Button onClick={() => socket.emit('tournament::admin:goToNextPhase', id, () => {
                        })}>
                            {t('tournament.admin.goToNextPhase')}
                        </Button>
                    </Box>
                )}
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 2}
                id={`simple-tabpanel-2`}
                aria-labelledby={`simple-tab-2`}
            >
                {tab === 2 && (
                    <Box sx={{p: 3}}>
                        <Grid container>
                            <Grid item xs={6} md={4}>
                                <Typography variant="h6">Admins</Typography>
                                <Stack direction="row">
                                    <PlayerPicker userData={newAdmin}
                                                  setUserData={handleNewAdmin} remove={false}/>
                                </Stack>
                                {accounts && tournament && tournament.admins && tournament.admins.map((admin: string, index: number) => (
                                    <Stack key={admin} direction="row">
                                        <Typography>{[accounts.find(p => admin === p.id)].map(a => a.username + "#" + a.discriminator)}</Typography>
                                        <Button disabled={tournament.admins.length <= 1}
                                                onClick={() => removeAdmin(index)}><DeleteIcon/></Button>
                                    </Stack>
                                ))}
                            </Grid>
                            <Grid item xs={6} md={4}>
                                <Typography variant="h6">Referees</Typography>
                                <Stack direction="row">
                                    <PlayerPicker userData={newReferee}
                                                  setUserData={handleNewReferee} remove={false}/>
                                </Stack>
                                {accounts && tournament && tournament.referees && tournament.referees.map((referee: string, index: number) => (
                                    <Stack key={referee} direction="row">
                                        <Typography>{[accounts.find(p => referee === p.id)].map(a => a.username + "#" + a.discriminator)}</Typography>
                                        <Button disabled={tournament.referees.length <= 1}
                                                onClick={() => removeReferee(index)}><DeleteIcon/></Button>
                                    </Stack>
                                ))}
                            </Grid>
                            <Grid item xs={6} md={4}>
                                <Typography variant="h6">Streamers</Typography>
                                <Stack direction="row">
                                    <PlayerPicker userData={newStreamer}
                                                  setUserData={handleNewStreamer} remove={false}/>
                                </Stack>
                                {accounts && tournament && tournament.streamers && tournament.streamers.map((streamer: string, index: number) => (
                                    <Stack key={streamer} direction="row">
                                        <Typography>{[accounts.find(p => streamer === p.id)].map(a => a.username + "#" + a.discriminator)}</Typography>
                                        <Button onClick={() => removeStreamer(index)}><DeleteIcon/></Button>
                                    </Stack>
                                ))}
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 3}
                id={`simple-tabpanel-3`}
                aria-labelledby={`simple-tab-3`}
            >
                {tab === 3 && (
                    <Box sx={{p: 3}}>
                        <TableContainer>
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>{t('tournament.name')}</TableCell>
                                    <TableCell>{t('tournament.team.registration.server')}</TableCell>
                                    <TableCell>{t('tournament.editor.validatedPlayersDesc')}</TableCell>
                                    <TableCell>{t('tournament.team.registration.catchPhrase')}</TableCell>
                                    <TableCell>{t('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {teams && teams.length > 0 && teams.map((team: TournamentTeamModel, index: number) => (
                                    <TableRow key={team.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{team.name}</TableCell>
                                        <TableCell>{team.server}</TableCell>
                                        <TableCell>{t('tournament.editor.validatedPlayers', {
                                            x: team.validatedPlayers.length,
                                            y: team?.players.length
                                        })}</TableCell>
                                        <TableCell>{team.catchPhrase}</TableCell>
                                        <TableCell>
                                            <Link
                                                to={`/tournament/${tournament.id}/tab/2/team/${team.id}`}>{t('tournament.editor.teamPage')}</Link>
                                            <Button color="error"
                                                    onClick={() => deleteTeam(team.id as string)}>{t('delete')}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </TableContainer>
                    </Box>
                )}
            </div>
        </div>
    )
}