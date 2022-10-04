import {Card, CardContent, Grid, Typography} from "@mui/material";
import {useContext, useEffect, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";

export default function TournamentHome() {
    const [home, setHome] = useState<any>()
    const {t} = useTranslation();
    const socket = useContext(SocketContext);

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
        socket.emit('tournament::home', (home: any) => {
            setHome(home);
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
                <Card sx={{m: 1}}>
                    <CardContent>
                        <Typography sx={{mb: 2}} variant="h5">{t('tournament.home.featured.title')}</Typography>
                        {home && home.featuredTournaments && home.featuredTournaments.length > 0 && home.featuredTournaments.map((featured: any) => (
                            <Link key={featured.id} to={`/tournament/${featured.id}`}>
                                <Typography>{featured.name + " - " + formatDate(featured.startdate) + " -> " + formatDate(featured.enddate)}</Typography>
                            </Link>
                        ))}
                        {(!home || !home.featuredTournaments || home.featuredTournaments.length <= 0) &&
                            <Typography>{t('tournament.home.featured.none')}</Typography>
                        }
                    </CardContent>
                </Card>
            </Grid>
            <Grid item md={6} xs={12}>
                <Card sx={{m: 1}}>
                    <CardContent>
                        <Typography sx={{mb: 2}} variant="h5">{t('tournament.home.matches.title')}</Typography>
                        {home && home.matches && home.matches.length > 0 && home.matches.map((match: any) => (
                            // <Link key={match.id} to={`/tournament/${featured.id}`}>
                            //     <Typography>{featured.name + " - " + featured.startdate + " -> " + featured.enddate}</Typography>
                            // </Link>
                            "TODO"
                        ))}
                        {(!home || !home.matches || home.matches.length <= 0) &&
                            <Typography>{t('tournament.home.matches.none')}</Typography>
                        }
                    </CardContent>
                </Card>
            </Grid>
            <Grid item md={6} xs={12}>
                <Card sx={{m: 1}}>
                    <CardContent>
                        <Typography sx={{mb: 2}} variant="h5">{t('tournament.home.registrations.title')}</Typography>
                        {home && home.registration && home.registration.length > 0 && home.registration.map((registration: any) => (
                            <Link key={registration.id} to={`/tournament/${registration.id}`}>
                                <Typography>{registration.name + " - " + formatDate(registration.startdate) + " -> " + formatDate(registration.enddate)}</Typography>
                            </Link>
                        ))}
                        {(!home || !home.registration || home.registration.length <= 0) &&
                            <Typography>{t('tournament.home.registrations.none')}</Typography>
                        }
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}