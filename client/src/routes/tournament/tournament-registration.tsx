import {Box, Button, MenuItem, Select, Stack, TextField, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
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
        <Stack spacing={1}>
            <Typography variant="h4">{t('tournament.team.registration.title')}</Typography>
            <TextField label={t('tournament.team.registration.name')} id="name" value={team.name} disabled={isStarted}
                       onChange={handleChange}/>
            <Select
                value={pickedServer}
                label={t('tournament.team.registration.server')}
            >
                {Object.keys(servers).map((server) => (
                    <MenuItem
                        key={server}
                        onClick={() => setServer(server)}
                        value={server}
                    >
                        {servers[server as any]}
                    </MenuItem>
                ))}
            </Select>
            <TextField label={t('tournament.team.registration.catchPhrase')} id="catchPhrase" value={team.catchPhrase}
                       onChange={handleChange}/>
            <Box>
                <Typography variant="h6">{t('tournament.team.registration.players')}</Typography>

                {players && players.map((player, index) => (
                    <PlayerPicker key={index} userData={player} disabled={isStarted}
                                  setUserData={(data) => handlerPlayerChange(index, data)}/>
                ))}
                <Button disabled={isStarted} onClick={addPlayer}>{t('tournament.team.registration.addPlayer')}</Button>
            </Box>

            <Button onClick={registerTeam}
                    disabled={(errors && errors.length > 0) || !team.name}>{t(teamId ? "modify" : "tournament.team.registration.register")}</Button>
            {teamId &&
                <Button color="error" onClick={deleteTeam}>{t('delete')}</Button>
            }
            {teamId &&
                <Typography>{t('tournament.team.registration.link', {link: `${window.location}/validate`})}</Typography>
            }
            {errors && errors.length > 0 && errors.map(error => (
                <Typography key={error}>{t(error)}</Typography>
            ))}
        </Stack>
    )
}