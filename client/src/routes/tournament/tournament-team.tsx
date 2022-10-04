import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Card, CardContent, Grid, Stack, Typography} from "@mui/material";
import {useContext, useEffect, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import {TournamentTeamModel} from "../../../../common/tournament/tournament-models";

export default function TournamentTeam() {
    const {t} = useTranslation();
    const {teamId} = useParams();
    const [team, setTeam] = useState({
        name: "",
        server: "",
        leader: "",
        catchPhrase: ""
    })
    const [players, setPlayers] = useState<any[]>([])
    const socket = useContext(SocketContext);

    useEffect(() => {
        socket.emit('tournament::getTeam', teamId, (team: TournamentTeamModel) => {
            setTeam(team);

            socket.emit('account::findByIds', team.players, (players: any[]) => {
                setPlayers(players);
            });
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Card>
            <CardContent>
                <Grid container>
                    <Grid item xs={12}>
                        <Typography variant="h4" style={{wordWrap: "break-word"}}>{team.name}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1"
                                    style={{wordWrap: "break-word"}}>"{team.catchPhrase}"</Typography>
                    </Grid>
                    <Grid item xs={12}>

                    </Grid>
                    <Grid container>
                        <Grid item xs={12} md={6}>
                            {players && players.map(player => (
                                <Stack key={player.id}>
                                    {/*TODO display validated*/}
                                    <Typography
                                        style={{wordWrap: "break-word"}}>{players.find(p => p.id === player.id).username}</Typography>
                                    <Typography
                                        style={{wordWrap: "break-word"}}>{t(player.id === team.leader ? 'tournament.display.captain' : 'tournament.display.player')}</Typography>
                                </Stack>
                            ))}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography>{t('coming.soon')}</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}