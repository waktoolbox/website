import {Box, Button, Card, CardContent, Grid, Typography} from "@mui/material";
import React, {useContext, useEffect, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import {useTranslation} from "react-i18next";
import TournamentCardView from "../../components/tournament/tournament-card-view";

export default function TournamentHome() {
    const [home, setHome] = useState<any>()
    const {t} = useTranslation();
    const socket = useContext(SocketContext);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    window.addEventListener('resize', () => setWindowWidth(window.innerWidth))

    const homeParallax = {
        parallax: {
            width: "100%",
            height: "480px",
            overflow: "hidden",
            backgroundColor: "#162834",
            backgroundImage: `url("/home/home_parallax.jpg")`
        },
        cra: {
            position: "relative",
            top: "16px",
            left: "-300px"
        },
        xelor: {
            position: "relative",
            top: "-70px",
            left: "260px",
        },
        portalTop: {
            position: "relative",
            top: "-310px",
            left: "-740px",
        },
        portalBottom: {
            position: "relative",
            top: "-170px",
            left: "-400px",
        }
    }

    useEffect(() => {
        socket.emit('tournament::home', (home: any) => {
            setHome(home);
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid container>
            <Grid className="homeParallax" item xs={12} display={{xs: "none", lg: "block", xl: "block"}}
                  style={homeParallax.parallax}
            >
                <img src="/home/xelor.png" style={homeParallax.xelor as React.CSSProperties} alt="Xelor"/>
                <img src="/home/cra.png" style={homeParallax.cra as React.CSSProperties} alt="Cra"/>
                <img src="/home/portal_top.png" style={homeParallax.portalTop as React.CSSProperties} alt="Portal top"/>
                <img src="/home/portal_bottom.png" style={homeParallax.portalBottom as React.CSSProperties}
                     alt="Portal bottom"/>

                <Box sx={{position: "absolute", top: "100px", left: `${windowWidth - 700}px`} as React.CSSProperties}>
                    <Typography variant="h3" style={{
                        width: "600px",
                        wordWrap: "break-word",
                        textAlign: "left"
                    }}><b>{t('tournament.home.waktool')}<span className="blueWord">Wakfu</span></b></Typography>
                </Box>
            </Grid>

            <Grid container spacing={2} alignItems="flex" sx={{width: '85%', margin: 'auto'}}>
                <Grid item xl={4} xs={12}>
                    <Typography sx={{mb: 2}} variant="h5"><span
                        className="firstWord">{t('tournament.title')}</span> {t('tournament.home.featured.title')}
                    </Typography>
                    {home && home.featuredTournament && (
                        <TournamentCardView tournament={home.featuredTournament} width={400} height={500}
                                            logoHeight={350}/>
                    )}
                    {(!home || !home.featuredTournament) && (
                        <Card sx={{
                            mr: "auto",
                            ml: "auto",
                            height: '500px',
                            width: '400px',
                            borderRadius: "8px",
                            boxShadow: "5px 5px 15px -10px #000000"
                        }}/>
                    )}
                </Grid>
                <Grid item xl={8} xs={12}>
                    <Typography sx={{mb: 2}} variant="h5"><span
                        className="firstWord">{t('tournament.titles')}</span> {t('tournament.home.tournaments.title')}
                    </Typography>
                    <Grid container spacing={2}>
                        {home && home.tournaments && home.tournaments.length > 0 && home.tournaments.map((tournament: any) => (
                            <Grid item xs={6} lg={3}>
                                <TournamentCardView tournament={tournament} height={432} width={200} logoHeight={200}
                                                    overriddenLevelAndServerMt={-3} overriddenLevelAndServer={30}/>
                            </Grid>
                        ))}
                        {Array.from({length: !home || !home.tournaments ? 4 : Math.max(0, 4 - home.tournaments.length)}).map(index => (
                            <Grid key={index as string} item xs={6} lg={3}>
                                <Card sx={{
                                    mr: "auto",
                                    ml: "auto",
                                    height: '432px',
                                    width: '200px',
                                    borderRadius: "8px",
                                    boxShadow: "5px 5px 15px -10px #000000"
                                }}/>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button sx={{mt: 2, width: '98%', color: '#848889 !important'}} variant="contained"
                                    disabled>{t('tournament.display.allTournaments')}</Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Typography sx={{mb: 2}} variant="h5"><span
                        className="firstWord">{t('tournament.registrations')}</span> {t('tournament.home.registrations.title')}
                    </Typography>

                    <Grid container spacing={2}>
                        {home && home.registration && home.registration.length > 0 && home.registration.map((registration: any) => (
                            <Grid item xs={6} lg={2}>
                                <TournamentCardView tournament={registration} height={300} width={200} logoHeight={150}
                                                    overriddenLevelAndServerMt={-3} overriddenLevelAndServer={30}
                                                    overriddenLink={`/tournament/${registration.id}/register`}/>
                            </Grid>
                        ))}
                        {Array.from({length: !home || !home.tournaments ? 4 : Math.max(0, 6 - home.tournaments.length)}).map(index => (
                            <Grid key={index as string} item xs={6} lg={2}>
                                <Card sx={{
                                    mr: "auto",
                                    ml: "auto",
                                    height: '300px',
                                    width: '200px',
                                    borderRadius: "8px",
                                    boxShadow: "5px 5px 15px -10px #000000"
                                }}/>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button sx={{mt: 2, width: '98%', color: '#848889 !important'}} variant="contained"
                                    disabled>{t('tournament.display.allRegistrations')}</Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="h5"><span
                        className="firstWord">{t('tournament.matches')}</span> {t('tournament.home.matches.title')}
                    </Typography>
                    <Card sx={{m: 1, backgroundColor: "#152429"}}>
                        <CardContent>
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
            </Grid>
        </Grid>
    )
}