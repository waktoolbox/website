import React, {useContext, useEffect, useState} from "react";
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import {TournamentDefinition, TournamentTeamModel} from "../../../../common/tournament/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {Link, useParams} from "react-router-dom";
import {Trans, useTranslation} from "react-i18next";
import {Button, Card, CardContent, Divider, Grid, Stack, Typography} from "@mui/material";

enum Tabs {
    HOME,
    TEAMS
}

const MenuButtonsStyle = {
    marginLeft: 3,
    marginRight: 3,
    fontSize: '1.1rem',
    color: '#8299a1',
    backgroundColor: 'rgba(0,0,0,0)'
}

const ActiveMenuButtonsStyle = {
    color: '#017d7f'
}

export default function Tournament() {
    const [tournament, setTournament] = useState<TournamentDefinition>();
    const [accounts, setAccounts] = useState(new Map<string, any>());
    const [teams, setTeams] = useState<any[]>();
    const [tab, setTab] = useState(Tabs.HOME)
    const [myTeam, setMyTeam] = useState<TournamentTeamModel | undefined>();
    const [me] = useState(localStorage.getItem("discordId"))
    const {id} = useParams();
    const socket = useContext(SocketContext)
    const {t} = useTranslation();

    useEffect(() => {
        socket.emit('tournament::get', id, (tournament: TournamentDefinition) => {
            setTournament(tournament);

            socket.emit('account::findByIds', [...tournament.admins, ...tournament.referees], (accs: any[]) => {
                const newAccounts = new Map<string, any>(accounts);
                accs.forEach(acc => newAccounts.set(acc.id, acc))
                setAccounts(newAccounts)
            })
        });

        socket.emit('tournament::getMyTeam', id, (team: TournamentTeamModel) => {
            setMyTeam(team)
        })
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const changeTab = (newTab: Tabs) => {
        if (tab === newTab) return;
        switch (newTab) {
            case Tabs.TEAMS:
                loadTeams();
                break;
        }
        setTab(newTab)
    }

    const loadTeams = () => {
        socket.emit('tournament::getTournamentTeamsWithLimit', id, (teams: TournamentTeamModel[]) => {
            if (!teams) return setTeams([]);
            setTeams(teams);
        })
    }

    return (
        <Grid container>
            {!tournament &&
                <Grid item>
                    {t('loading')}
                </Grid>
            }

            {tournament &&
                <div style={{width: "100%"}}>
                    <Grid item xs={12} sx={{width: "100%", backgroundColor: "#162834"}}>
                        <img src={tournament.logo} alt="logo" style={{maxWidth: "1500px", height: "100%"}}/>
                    </Grid>
                    <Grid container justifyContent="center">
                        <Grid item xs={12} md={10} xl={8} sx={{backgroundColor: "#162329", display: "block"}}>
                            <Stack>
                                <Typography variant="h4" sx={{
                                    textAlign: "start",
                                    pt: 3,
                                    pl: 3,
                                    textTransform: "uppercase"
                                }}>{tournament.name}</Typography>
                                <Typography variant="h6" sx={{textAlign: "start", pl: 3, color: "#698185"}}>
                                    {t('tournament.fromTo', {
                                        from: new Date(Date.parse(tournament.startDate)),
                                        to: new Date(Date.parse(tournament.endDate))
                                    })}
                                </Typography>
                                <Typography sx={{
                                    ml: 3, mt: 2, mb: 3,
                                    borderRadius: 3, backgroundColor: "#017d7f",
                                    width: "150px", height: "40px",
                                    pl: 2, pr: 2,
                                    display: "flex", flexDirection: "column", justifyContent: "center"
                                }}>
                                    <b>{t('tournament.display.levelAndServer', {
                                        level: tournament.level,
                                        server: tournament.server
                                    })}</b>
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={10} xl={8} sx={{backgroundColor: "#1f333a", pb: 4}}>
                            <Stack direction="row" sx={{ml: 2, mt: 2}}>
                                <Button variant="text"
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.HOME ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.HOME)}>
                                    <BookmarksIcon sx={{color: (tab === Tabs.HOME ? "017d7f" : "8299a1"), mr: 1}}/>
                                    {t('tournament.display.information')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Button variant="text"
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.TEAMS ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.TEAMS)}>
                                    <Diversity3Icon sx={{color: (tab === Tabs.HOME ? "017d7f" : "8299a1"), mr: 1}}/>
                                    {t('tournament.display.teamsButton')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Button variant="text" style={MenuButtonsStyle}
                                        disabled={Date.parse(tournament.startDate).toString() > Date.now().toString()}>
                                    <CalendarMonthIcon sx={{mr: 1}}/>
                                    {t('tournament.display.planning')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Button variant="text" style={MenuButtonsStyle}
                                        disabled={Date.parse(tournament.startDate).toString() > Date.now().toString()}>
                                    <EmojiEventsIcon sx={{mr: 1}}/>
                                    {t('tournament.display.results')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Link to={`/edit-tournament/${tournament.id}`}
                                      hidden={!tournament.admins.includes(localStorage.getItem('discordId') || "")}>
                                    <Button variant="text" style={MenuButtonsStyle}>
                                        <MiscellaneousServicesIcon sx={{mr: 1}}/>
                                        {t('tournament.administrate')}
                                    </Button>
                                </Link>
                            </Stack>
                            <Divider sx={{ml: 3, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>


                            {tab === Tabs.HOME &&
                                <Grid container>
                                    <Grid item lg={8} xs={12} sx={{textAlign: "start", pl: 4}}>
                                        <Stack>
                                            <Typography variant="h5" sx={{
                                                color: '#8299a1',
                                                mb: 2
                                            }}>{t('tournament.description')}</Typography>
                                            <Typography sx={{mb: 2}}>TODO description</Typography>
                                            <Divider sx={{ml: -1, pr: 10, mt: 2, mb: 2}} variant="middle" flexItem/>
                                            <Typography variant="h5" sx={{
                                                color: '#8299a1',
                                                mb: 2
                                            }}>{t('tournament.rewards')}</Typography>
                                            <Typography sx={{mb: 2}}>TODO rewards</Typography>
                                            <Divider sx={{ml: -1, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>
                                            <Typography variant="h5" sx={{
                                                color: '#8299a1',
                                                mb: 2
                                            }}>{t('tournament.rules')}</Typography>
                                            <Typography sx={{mb: 2}}>TODO rules</Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid item lg={4} xs={12} sx={{pl: 3, pr: 3}}>
                                        <Stack spacing={2}>
                                            <Link to={`/tournament/${tournament.id}/register`}
                                                  hidden={Date.parse(tournament.startDate).toString() < Date.now().toString() || (myTeam && myTeam.id !== undefined)}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}>{t('tournament.display.register')}</Button>
                                            </Link>
                                            <Link to={`/tournament/${tournament.id}/team/${myTeam?.id}`}
                                                  hidden={!myTeam}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}>{t('tournament.display.myTeam')}</Button>
                                            </Link>
                                            <Link to={`/tournament/${tournament.id}/register/${myTeam?.id}`}
                                                  hidden={!myTeam || myTeam.leader !== me}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}>{t('tournament.display.manageMyTeam')}</Button>
                                            </Link>
                                            <Link to={`/tournament/${tournament.id}/register/${myTeam?.id}/validate`}
                                                  hidden={!myTeam || myTeam.leader === me}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}>{t('tournament.display.manageMyRegistration')}</Button>
                                            </Link>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    <Typography variant="h4" sx={{
                                                        textAlign: "start",
                                                        mb: 1
                                                    }}>{t('tournament.admins')}</Typography>
                                                    {tournament.admins.map(admin => (
                                                        <Typography
                                                            sx={{color: "#8299a1"}}>{[accounts.get(admin)].map(a => !a ? "" : a.username + "#" + a.discriminator)}</Typography>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    <Typography variant="h4" sx={{
                                                        textAlign: "start",
                                                        mb: 1
                                                    }}>{t('tournament.referees')}</Typography>
                                                    {tournament.referees.map(referee => (
                                                        <Typography
                                                            sx={{color: "#8299a1"}}>{[accounts.get(referee)].map(a => !a ? "" : a.username + "#" + a.discriminator)}</Typography>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            }

                            {tab === Tabs.TEAMS &&
                                <Grid container justifyContent="center">
                                    <Grid item xs={12}>
                                        <Typography variant="h4" sx={{textTransform: "uppercase", mt: 2, mb: 3}}>
                                            <b><Trans i18nKey="tournament.team.participating"
                                                      components={{span: <span className="blueWord"/>}}/></b>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        {teams && teams.length > 0 && teams.map(team => (
                                            <Card sx={{
                                                m: 3,
                                                borderRadius: 4,
                                                boxShadow: '5px 5px 15px 0px #000000',
                                                '.MuiCardContent-root': {p: 3}
                                            }}>
                                                <CardContent sx={{backgroundColor: "#162329", textAlign: "start"}}>
                                                    <Typography display="inline"
                                                                variant="h6"
                                                                sx={{mr: 2}}>{team.content.name}</Typography>
                                                    <Typography display="inline" sx={{verticalAlign: "1px"}}><span
                                                        className="blueWord">{team.content.server}</span></Typography>
                                                    <Divider sx={{
                                                        ml: 2,
                                                        mr: 2,
                                                        mt: 0,
                                                        mb: 0,
                                                        display: "inline",
                                                        pt: 1,
                                                        pb: 1
                                                    }}
                                                             orientation="vertical" variant="middle" flexItem/>
                                                    <Typography display="inline" sx={{mr: 2}}><EmojiEventsIcon sx={{
                                                        verticalAlign: "middle",
                                                        mr: 1,
                                                        mb: '3px'
                                                    }}/>{t('tournament.nbVictories', {nb: 0})}</Typography>
                                                    <Typography display="inline"
                                                                sx={{color: "#8299a1", mr: 2}}><ListAltIcon
                                                        sx={{
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            mb: '3px'
                                                        }}/>{t('tournament.nbMatchesPlayed', {nb: 0})}</Typography>

                                                    {/*TODO v1 : bind */}
                                                    <Button sx={{float: "right"}}>{t('tournament.team.goTo')}</Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Grid>
                                </Grid>
                            }

                        </Grid>
                    </Grid>
                </div>
            }
        </Grid>
    )
}