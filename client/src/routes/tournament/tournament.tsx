import {useContext, useEffect, useState} from "react";
import {TournamentDefinition} from "../../../../common/tournament/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {Link, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Card, CardContent, Container, Divider, Grid, Stack, Typography} from "@mui/material";

export default function Tournament() {
    const [tournament, setTournament] = useState<TournamentDefinition>();
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
        socket.emit('tournament::get', id, ((t: TournamentDefinition) => {
            setTournament(t);
        }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Card sx={{m: 2}}>
            <CardContent>
                <Grid container width="100%">
                    {tournament &&
                        <Container sx={{width: "100%"}}>
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
                                      hidden={Date.parse(tournament.startDate).toString() < Date.now().toString()}>
                                    <Button>{t('tournament.display.register')}</Button>
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
                                        TODO
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Container>
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