import React, {useContext, useEffect, useState} from "react";
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckIcon from '@mui/icons-material/Check';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import {TournamentDefinition, TournamentTeamModel} from "../../../../common/tournament/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Trans, useTranslation} from "react-i18next";
import {Button, Card, CardContent, Divider, Grid, Icon, Stack, Typography} from "@mui/material";

enum Tabs {
    HOME,
    TEAMS,
    SINGLE_TEAM
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

const accountPersistence = new Map<string, any>();

export default function Tournament() {
    const {id, targetTab, teamId} = useParams();
    const [localTeamId, setLocalTeamId] = useState<string>(teamId as string);
    const [tournament, setTournament] = useState<TournamentDefinition>();
    const [accounts, setAccounts] = useState(new Map<string, any>());
    const [teams, setTeams] = useState<any[]>();
    const [team, setTeam] = useState<TournamentTeamModel>();
    const [tab, setTab] = useState(Tabs.HOME)
    const [myTeam, setMyTeam] = useState<TournamentTeamModel | undefined>();
    const [me] = useState(localStorage.getItem("discordId"))
    const socket = useContext(SocketContext)
    const {t} = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        socket.emit('tournament::get', id, (tournament: TournamentDefinition) => {
            if (!tournament) {
                console.error("Tournament not found");
                return;
            }

            socket.emit('account::findByIds', [...tournament.admins, ...tournament.referees], (accs: any[]) => {
                accs.forEach(acc => accountPersistence.set(acc.id, acc))
                setAccounts(accountPersistence)
                setTournament(tournament);
            })

        });

        socket.emit('tournament::getMyTeam', id, (team: TournamentTeamModel) => {
            setMyTeam(team);
        })

        if (targetTab && targetTab !== "0") changeTab(Tabs[Tabs[targetTab as any] as any] as unknown as Tabs);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const changeTab = (newTab: Tabs) => {
        if (tab === newTab) return;
        switch (newTab) {
            case Tabs.HOME:
                navigate(`/tournament/${id}`);
                break;
            case Tabs.TEAMS:
                navigate(`/tournament/${id}/tab/1`);
                loadTeams();
                break;
            case Tabs.SINGLE_TEAM:
                loadTeam();
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

    const loadTeam = (tid?: string, goToTab?: boolean) => {
        if (goToTab) setTab(Tabs.SINGLE_TEAM);
        socket.emit('tournament::getTeam', tid || localTeamId, (team: TournamentTeamModel) => {
            if (!team) return;

            socket.emit('account::findByIds', team.players, (accs: any[]) => {
                accs.forEach(acc => accountPersistence.set(acc.id, acc))
                setAccounts(accountPersistence)
                setTeam(team);
            })
        })
    }

    const goToTeam = (tid: string) => {
        setLocalTeamId(tid);
        loadTeam(tid, true)
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
                        <img src={tournament.logo} alt="logo"
                             style={{maxWidth: "1268px", width: "100%", objectFit: "cover"}}/>
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
                            <Stack direction={{xs: 'column', lg: 'row'}} sx={{ml: 2, mt: 2}}>
                                <Button variant="text"
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.HOME ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.HOME)}>
                                    <BookmarksIcon sx={{color: (tab === Tabs.HOME ? "017d7f" : "8299a1"), mr: 1}}/>
                                    {t('tournament.display.information')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                {/*TODO later option on tournament to enable link before tournament start*/}
                                <Button variant="text"
                                        disabled={Date.parse(tournament.startDate).toString() > Date.now().toString()}
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
                                            <Typography sx={{mb: 2, whiteSpace: "pre-line"}}>
                                                {t('tmp.description')}
                                            </Typography>

                                            <Divider sx={{ml: -1, pr: 10, mt: 2, mb: 2}} variant="middle" flexItem/>
                                            <Typography variant="h5" sx={{
                                                color: '#8299a1',
                                                mb: 2
                                            }}>{t('tournament.rewards')}</Typography>
                                            {/*TODO later real rewards here*/}
                                            <Typography sx={{mb: 2, whiteSpace: "pre-line"}}>
                                                {t('tmp.rewards')}
                                            </Typography>

                                            <Divider sx={{ml: -1, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>
                                            <Typography variant="h5" sx={{
                                                color: '#8299a1',
                                                mb: 2
                                            }}>{t('tournament.rules')}</Typography>
                                            {/*TODO later real rules here*/}
                                            <a href="https://static.ankama.com/upload/backoffice/direct/2022-10-07/Wakfu_Warriors_2022_Rules_en-us.pdf"
                                               rel="noreferrer" target="_blank">
                                                <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                    <img src={`/flags/en.svg`} alt={`flag_en`}/>
                                                </Icon>
                                                <Typography display="inline">Rules</Typography>
                                            </a>
                                            <a href="https://static.ankama.com/upload/backoffice/direct/2022-10-04/WAKFU_Warriors_2022_Reglement.pdf"
                                               rel="noreferrer" target="_blank">
                                                <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                    <img src={`/flags/fr.svg`} alt={`flag_fr`}/>
                                                </Icon>
                                                <Typography display="inline">Règlement</Typography>
                                            </a>
                                            <a href="https://static.ankama.com/upload/backoffice/direct/2022-10-07/Wakfu_Warriors_2022_Rules_pt-br.pdf"
                                               rel="noreferrer" target="_blank">
                                                <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                    <img src={`/flags/pt.svg`} alt={`flag_pt`}/>
                                                </Icon>
                                                <Typography display="inline">Regulamento</Typography>
                                            </a>
                                            {/*<a href="https://static.ankama.com/upload/backoffice/direct/2022-10-07/Wakfu_Warriors_2022_Rules_pt-br.pdf" target="_blank">*/}
                                            <div>
                                                <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                    <img src={`/flags/es.svg`} alt={`flag_es`}/>
                                                </Icon>
                                                <Typography display="inline">La traducción del reglamento estará
                                                    disponible próximamente.</Typography>
                                            </div>
                                            {/*</a>*/}
                                        </Stack>
                                    </Grid>
                                    <Grid item lg={4} xs={12} sx={{pl: 3, pr: 3}}>
                                        <Stack spacing={2}>
                                            <Link to={`/tournament/${tournament.id}/register`}
                                                  hidden={Date.parse(tournament.startDate).toString() < Date.now().toString() || (myTeam && myTeam.id !== undefined) || !me}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}>{t('tournament.display.register')}</Button>
                                            </Link>
                                            <Link to={`/tournament/${tournament.id}/tab/2/team/${myTeam?.id}`}
                                                  hidden={!myTeam}>
                                                <Button sx={{
                                                    width: "100%",
                                                    pt: 1,
                                                    pb: 1
                                                }}
                                                        onClick={() => goToTeam(myTeam?.id || "")}>{t('tournament.display.myTeam')}</Button>
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
                                                        <Typography key={admin}
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
                                                        <Typography key={referee}
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
                                            <Card key={team} sx={{
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
                                                        ml: 2, mr: 2, mt: 0, mb: 0,
                                                        display: "inline",
                                                        pt: 1, pb: 1
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

                                                    <Link to={`/tournament/${id}/tab/2/team/${team.content.id}`}>
                                                        <Button sx={{float: "right"}}
                                                                onClick={() => goToTeam(team.content.id)}>{t('tournament.team.goTo')}</Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Grid>
                                </Grid>
                            }

                            {tab === Tabs.SINGLE_TEAM && team &&
                                <Grid container>
                                    <Grid item lg={8} xs={12} sx={{textAlign: "start", pl: 4}}>
                                        <Grid container>
                                            <Grid item xs={12}>
                                                <Typography variant="h4" sx={{
                                                    wordWrap: "break-word",
                                                    mt: 5
                                                }}><b>{team.name}</b></Typography>
                                                <Typography variant="h5" sx={{
                                                    wordWrap: "break-word",
                                                    mt: 1
                                                }}>{team.catchPhrase}</Typography>
                                                <Typography sx={{
                                                    mt: 2, mb: 3,
                                                    borderRadius: 2, backgroundColor: "#017d7f",
                                                    width: "120px", height: "40px",
                                                    pl: 2, pr: 2,
                                                    display: "flex", flexDirection: "column", justifyContent: "center",
                                                    fontSize: "0.8rem", textTransform: "uppercase", textAlign: "center"
                                                }}>{team.server}</Typography>

                                                <Divider sx={{ml: 3, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>

                                                <Typography variant="h5"><Trans i18nKey="tournament.home.matches.title"
                                                                                components={{
                                                                                    span: <span className="firstWord"/>
                                                                                }}/></Typography>

                                                {/*TODO v2*/}
                                                <Typography sx={{mt: 2}}>{t('coming.soon')}</Typography>

                                                <Divider sx={{ml: 3, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>

                                                <Typography variant="h5"
                                                            sx={{color: "#fefffa"}}>{t('tournament.display.results')}</Typography>

                                                {/*TODO v2*/}
                                                <Typography sx={{mt: 2}}>{t('coming.soon')}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item lg={4} xs={12} sx={{pl: 3, pr: 3}}>
                                        <Stack spacing={2}>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    {/*TODO v2 stats*/}
                                                    <Typography sx={{color: "#8299a1", mr: 2}}><ListAltIcon
                                                        sx={{
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            mb: '3px'
                                                        }}/>{t('tournament.nbMatchesPlayed', {nb: 0})}</Typography>
                                                    <Typography sx={{mr: 2, color: "#07c6b6"}}>
                                                        <EmojiEventsIcon sx={{
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            mb: '3px'
                                                        }}/>{t('tournament.nbVictories', {nb: 0})}</Typography>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    <Typography variant="h4" sx={{
                                                        textAlign: "start",
                                                        mb: 1
                                                    }}>{t('tournament.team.members')}</Typography>
                                                    {team.players.map(player => (
                                                        <Typography key={player} sx={{color: "#8299a1"}}>
                                                            {[accounts.get(player)].map(a => !a ? "" : a.username + "#" + a.discriminator)}
                                                            {team?.validatedPlayers.includes(player) &&
                                                                <CheckIcon sx={{
                                                                    color: "#006400",
                                                                    ml: 1,
                                                                    verticalAlign: "-5px"
                                                                }}/>
                                                            }
                                                        </Typography>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        </Stack>
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