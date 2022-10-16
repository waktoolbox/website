import {Button, Stack, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import React, {useContext, useEffect, useState} from "react";
import {TournamentTeamModel} from "../../utils/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {useNavigate, useParams} from "react-router-dom";

export default function TournamentRegistrationValidation() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id, teamId} = useParams();
    const [me] = useState<string>(localStorage.getItem('discordId') || "")
    const [team, setTeam] = useState<TournamentTeamModel>({
        name: "",
        leader: ""
    } as TournamentTeamModel);
    const [players, setPlayers] = useState<any[]>([])
    const socket = useContext(SocketContext);

    useEffect(() => {
        socket.emit('tournament::getTeam', teamId, (team: TournamentTeamModel) => {
            if (!team) {
                navigate(`/tournament/${id}`)
                return;
            }

            setTeam(team);
            socket.emit('account::findByIds', team.players, (results: any[]) => {
                if (!results) return;

                const sort = results.map(result => ({
                    id: result?.id || "",
                    username: result?.username,
                    discriminator: result?.discriminator,
                    locked: result.id === me,
                    verified: result?.id !== undefined
                })).sort((a, b) => a.locked ? -1 : 0) as any[];

                setPlayers(sort);
            })
        })
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const validateMe = () => {
        socket.emit('tournament::validatePlayer', teamId, (success: boolean) => {
            navigate(`/tournament/${id}`);
        });
    }

    const invalidateMe = () => {
        socket.emit('tournament::invalidatePlayer', teamId, (success: boolean) => {
            if (success) navigate(`/tournament/${id}`);
        })
    }

    return (
        <Stack spacing={1} sx={{width: "fit-content", margin: "auto", mt: 2}} justifyContent="center">
            <Typography variant="h4">{t('tournament.team.registration.validation.question')}</Typography>
            <Typography variant="h5">{team.name}</Typography>
            {team && team.players && team.players.map((playerId: string) => (
                <Typography
                    key={playerId}>{players.find(p => p.id === playerId)?.username} - {t(playerId === team.leader ? 'tournament.display.captain' : 'tournament.display.player')}</Typography>
            ))}

            <Button onClick={validateMe} color="success" variant="contained"
                    sx={{width: "50%", margin: "8px auto !important"}}
                    disabled={team.validatedPlayers && team.validatedPlayers.includes(me)}
                    hidden={!me || me.length <= 0}>{t("validate")}</Button>
            <Button onClick={invalidateMe} color="error" variant="contained"
                    sx={{width: "50%", margin: "8px auto !important"}}
                    disabled={team && ((team.validatedPlayers && !team.validatedPlayers.includes(me)) || team.leader === me)}
                    hidden={!me || me.length <= 0}>{t("invalidate")}</Button>
        </Stack>
    )
}