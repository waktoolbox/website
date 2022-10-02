import {useContext, useEffect, useState} from "react";
import {TournamentDefinition, TournamentTeamModel} from "../../../../common/tournament/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {Link, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Card, CardContent, Divider, Grid, Stack, Typography} from "@mui/material";

export default function Tournament() {
    const [tournament, setTournament] = useState<TournamentDefinition>();
    const [teams, setTeams] = useState<TournamentTeamModel[]>();
    const [myTeam, setMyTeam] = useState<TournamentTeamModel | undefined>();
    const {id} = useParams();
    const socket = useContext(SocketContext)
    const {t} = useTranslation();

    function formatDate(rawDate: string): string {
        const parsed = Date.parse(rawDate);
        const date = new Date(parsed);
        return t('dateTime', {
            date: date,
            hours: date.getHours().toLocaleString("en-US", {minimumIntegerDigits: 2}),
            minutes: date.getMinutes().toLocaleString("en-US", {minimumIntegerDigits: 2})
        });
    }

    useEffect(() => {
        socket.emit('tournament::getWithTeams', id, ((t: { tournament: TournamentDefinition, teams: TournamentTeamModel[] }) => {
            setTournament(t.tournament);
            setTeams(t.teams)
        }));

        socket.emit('tournament::getMyTeam', id, (team: TournamentTeamModel) => {
            setMyTeam(team)
        })
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Card sx={{m: 2}}>
            <CardContent>
                <Grid container width="100%">
                    {tournament &&
                        <>
                            <Grid item md={12} display="flex" justifyContent="center" alignItems="center">
                                <Stack>
                                    <Typography variant="h2">{tournament.name}</Typography>
                                    <Divider sx={{mb: 1}}/>
                                    <Typography variant="h5">{t('tournament.fromTo', {
                                        from: formatDate(tournament.startDate),
                                        to: formatDate(tournament.endDate)
                                    })}</Typography>
                                </Stack>
                            </Grid>
                            <Grid container sx={{mt: 2}} justifyContent="center" alignItems="center">
                                <Link to="/todo"
                                      hidden={Date.parse(tournament.startDate).toString() > Date.now().toString()}>
                                    <Button>{t('tournament.display.planning')}</Button>
                                </Link>
                                <Link to="/todo"
                                      hidden={Date.parse(tournament.startDate).toString() > Date.now().toString()}>
                                    <Button>{t('tournament.display.results')}</Button>
                                </Link>
                                <Link to={`/tournament/${tournament.id}/register`}
                                      hidden={Date.parse(tournament.startDate).toString() < Date.now().toString() || myTeam != undefined}>
                                    <Button>{t('tournament.display.register')}</Button>
                                </Link>
                                <Link to={`/tournament/${tournament.id}/team/${myTeam?.id}`}
                                      hidden={!myTeam}>
                                    <Button>{t('tournament.display.myTeam')}</Button>
                                </Link>
                                <Link to={`/tournament/${tournament.id}/register/${myTeam?.id}`}
                                      hidden={!myTeam}>
                                    <Button>{t('tournament.display.manageMyTeam')}</Button>
                                </Link>
                                <Link to={`/edit-tournament/${tournament.id}`}
                                      hidden={!tournament.admins.includes(localStorage.getItem('discordId') || "")}>
                                    <Button>{t('tournament.administrate')}</Button>
                                </Link>
                            </Grid>
                            <Grid container sx={{mt: 2}}>
                                <Grid item md={6} xs={12}>
                                    <Stack>
                                        <Typography>{t('tournament.display.level', {lvl: tournament.level})}</Typography>
                                        <Typography>{t('tournament.display.teams', {
                                            qty: tournament.teamNumber,
                                            size: tournament.teamSize
                                        })}</Typography>
                                        <Divider sx={{m: 1}}/>
                                        <Typography variant="h6">{t('tournament.description')}</Typography>
                                        <Typography>{tournament.description}</Typography>
                                        <Divider sx={{m: 1}}/>
                                        <Typography variant="h6">{t('tournament.rewards')}</Typography>
                                        <Typography>{tournament.rewards}</Typography>
                                        <Divider sx={{m: 1}}/>
                                        <Typography variant="h6">{t('tournament.rules')}</Typography>
                                        <Typography>{tournament.rules}</Typography>
                                        <Divider sx={{m: 1}}/>
                                        <Typography>Maps TODO</Typography>
                                        <Typography>Phases TODO</Typography>
                                        <Typography>Admins TODO</Typography>
                                        <Typography>Arbitres TODO</Typography>
                                        <Typography>Streamers TODO</Typography>
                                    </Stack>
                                </Grid>
                                <Grid item md={6} xs={12}>
                                    <Stack>
                                        <Typography variant="h6">{t('tournament.teams')}</Typography>
                                        {teams && teams.length > 0 && teams[0].id && teams.map(team => (
                                            <Link key={team.id} to={`/tournament/${id}/team/${team.id}`}>
                                                <Grid container sx={{mb: 1}}>
                                                    <Grid item xs={6} xl={4}>
                                                        {team.name}
                                                    </Grid>
                                                    <Grid item xs={6} xl={8}>
                                                        {team.server}
                                                    </Grid>
                                                </Grid>
                                            </Link>
                                        ))}
                                        {(!teams || teams.length == 0 || !teams[0].id) &&
                                            <Typography>{t('tournament.display.noTeam')}</Typography>
                                        }
                                    </Stack>
                                </Grid>
                            </Grid>
                        </>
                    }
                    {!tournament &&
                        <Grid item>
                            {t('loading')}
                        </Grid>
                    }
                </Grid>
            </CardContent>
        </Card>
    )
}