import React, {ChangeEvent, useContext, useEffect, useState} from "react";
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckIcon from '@mui/icons-material/Check';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import VideogameAssetOffIcon from '@mui/icons-material/VideogameAssetOff';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import HealingIcon from '@mui/icons-material/Healing';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {TournamentDefinition, TournamentMatchModel, TournamentTeamModel} from "../../utils/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Trans, useTranslation} from "react-i18next";
import {
    Button,
    Card,
    CardContent,
    Divider,
    FormControlLabel,
    Grid,
    Icon,
    Radio,
    RadioGroup,
    Stack,
    Tooltip,
    Typography
} from "@mui/material";
import TournamentTeamMatchView from "../../components/tournament/tournament-team-match-view";
import TournamentMatchView from "../../components/tournament/tournament-match-view";
import TournamentMatchPlanningListView from "../../components/tournament/tournament-match-planning-list-view";
import WakfuWarriorsMatchResultListView from "../../components/tournament/impl/wakfu-warriors-match-result-list-view";
import {UserContext} from "../../context/user-context";
import WakfuWarriorsTreeView from "../../components/tournament/impl/wakfu-warriors-match-tree-view";

enum Tabs {
    HOME,
    TEAMS,
    SINGLE_TEAM,
    PLANNING,
    MATCH,
    RESULTS,
    TREE
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
const streamerPersistence = new Map<string, any>();
const teamsNamesPersistence = new Map<string, string>();

export default function Tournament() {
    const {id, targetTab, teamId, matchId} = useParams();
    const [localTeamId, setLocalTeamId] = useState<string>(teamId as string);
    const [localMatchId, setLocalMatchId] = useState<string>(matchId as string)
    const [tournament, setTournament] = useState<TournamentDefinition>();
    const [accounts, setAccounts] = useState(new Map<string, any>());
    const [streamers, setStreamers] = useState(new Map<string, any>());
    const [teams, setTeams] = useState<any[]>();
    const [team, setTeam] = useState<TournamentTeamModel>();
    const [tab, setTab] = useState(Tabs.HOME)
    const [myTeam, setMyTeam] = useState<TournamentTeamModel | undefined>();
    const [planningToDisplay, setPlanningToDisplay] = useState<TournamentMatchModel[]>();
    const [resultToDisplay, setResultToDisplay] = useState<TournamentMatchModel[]>();
    const [allMatches, setAllMatches] = useState<TournamentMatchModel[]>();
    const [teamMatches, setTeamMatches] = useState<TournamentMatchModel[]>();
    const [currentMatch, setCurrentMatch] = useState<TournamentMatchModel>();
    const [phases, setPhases] = useState<number[]>([]);
    const [phase, setPhase] = useState<number>(0);

    const [me] = useState(localStorage.getItem("discordId"))
    const socket = useContext(SocketContext);
    const userContext = useContext(UserContext);
    const {t} = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        socket.emit('tournament::get', id, (tournament: TournamentDefinition) => {
            if (!tournament) {
                console.error("Tournament not found");
                return;
            }

            socket.emit('account::findByIds', [...tournament.admins, ...tournament.referees, ...tournament.streamers], (accs: any[]) => {
                accs.forEach(acc => accountPersistence.set(acc.id, acc))
                setAccounts(accountPersistence)
                setTournament(tournament);
            })

        });

        socket.emit('tournament::getPhases', id, (phases: number[]) => {
            if (!phases) return;
            setPhases(phases);
            setPhase(Math.max(...phases))
        })

        socket.emit('tournament::getMyTeam', id, (team: TournamentTeamModel) => {
            setMyTeam(team);
            if (team) {
                userContext.dispatch({type: "setMyTeam", payload: team.id});
            }
        })
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setTeam(undefined);
        if (teamId) loadTeam(teamId, true);
    }, [teamId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setCurrentMatch(undefined);
        if (matchId) loadMatch();
    }, [matchId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (targetTab && targetTab !== "0") changeTab(Tabs[Tabs[targetTab as any] as any] as unknown as Tabs);
    }, [targetTab]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (tab === Tabs.PLANNING) {
            loadNextMatches();
        }
        if (tab === Tabs.RESULTS) {
            loadMatchesResult();
        }
        if (tab === Tabs.TREE) {
            loadAllMatches();
        }
    }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps


    const changeTab = (newTab: Tabs) => {
        switch (newTab) {
            case Tabs.HOME:
                navigate(`/tournament/${id}`);
                break;
            case Tabs.TEAMS:
                navigate(`/tournament/${id}/tab/1`);
                loadTeams();
                break;
            case Tabs.PLANNING:
                setCurrentMatch(undefined);
                navigate(`/tournament/${id}/tab/3`);
                loadNextMatches();
                break;
            case Tabs.RESULTS:
                setCurrentMatch(undefined);
                navigate(`/tournament/${id}/tab/5`);
                loadMatchesResult()
                break;
            case Tabs.TREE:
                setCurrentMatch(undefined);
                navigate(`/tournament/${id}/tab/6`);
                loadAllMatches()
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
        socket.emit('tournament::getAllTeamMatches', tid || localTeamId, (matches: TournamentMatchModel[]) => {
            matches.sort((a, b) => {
                if (a.date && b.date) return (Date.parse(a.date).toString() > Date.parse(b.date).toString()) ? -1 : 1;
                if (a.date && !b.date) return 1;
                if (!a.date && b.date) return -1;
                return 0;
            })

            const namesToRequest: string[] = [];
            matches.forEach(m => {
                if (!teamsNamesPersistence.has(m.teamA) && !namesToRequest.includes(m.teamA)) {
                    namesToRequest.push(m.teamA)
                }
                if (!teamsNamesPersistence.has(m.teamB) && !namesToRequest.includes(m.teamB)) {
                    namesToRequest.push(m.teamB)
                }
            })
            loadTeamNames(namesToRequest, () => setTeamMatches(matches));
        })

        socket.emit('tournament::getTeam', tid || localTeamId, (team: TournamentTeamModel) => {
            if (!team) return;

            socket.emit('account::findByIds', team.players, (accs: any[]) => {
                accs.forEach(acc => accountPersistence.set(acc.id, acc))
                setAccounts(accountPersistence)
                setTeam(team);
            })
        })
    }

    const loadNextMatches = () => {
        loadMatchesToDisplay('tournament::getNextMatches', setPlanningToDisplay)
    }

    const loadMatchesResult = () => {
        loadMatchesToDisplay('tournament::getMatchesResult', setResultToDisplay)
    }

    const loadAllMatches = () => {
        loadMatchesToDisplay('tournament::getAllMatches', setAllMatches, 2)
    }

    const loadMatchesToDisplay = (event: string, callbackSetter: any, forcedPhase: number = phase) => {
        socket.emit(event, id, forcedPhase, (matches: TournamentMatchModel[]) => {
            const namesToRequest: string[] = [];
            matches.forEach(t => {
                if (!t || !t.id) return;
                if (!teamsNamesPersistence.has(t.teamA)) {
                    namesToRequest.push(t.teamA)
                }
                if (!teamsNamesPersistence.has(t.teamB)) {
                    namesToRequest.push(t.teamB)
                }
            })
            loadTeamNames(namesToRequest, () => callbackSetter(matches))
        })
    }

    const loadTeamNames = (namesToRequest: string[], callback: any) => {
        if (namesToRequest.length <= 0) callback()

        socket.emit('tournament::getTeamsNames', namesToRequest, (names: { id: string, name: string }[]) => {
            names.forEach(name => {
                teamsNamesPersistence.set(name.id, name.name)
            })
            callback()
        })
    }

    const loadMatch = (match?: string, goToTab?: boolean) => {
        if (goToTab) {
            setTab(Tabs.MATCH);
            if (match) {
                setLocalMatchId(match);
                navigate(`/tournament/${id}/tab/4/match/${match}`);
            }
        }
        socket.emit('tournament::getMatch', match || localMatchId, (match: TournamentMatchModel) => {
            if (!match) return;

            if (match.streamer && !streamerPersistence.has(match.streamer)) {
                socket.emit('account::getStreamer', match.streamer, (streamer: any) => {
                    streamerPersistence.set(streamer.id, streamer);
                    setStreamers(streamerPersistence);
                })
            }

            socket.emit('tournament::getTeamsNames', [match.teamA, match.teamB], (names: { id: string, name: string }[]) => {
                names.forEach(name => {
                    teamsNamesPersistence.set(name.id, name.name)
                })
                setCurrentMatch(match)
            })
        })
    }

    const goToTeam = (tid: string) => {
        setLocalTeamId(tid);
        loadTeam(tid, true)
    }

    function PhaseButton() {
        return (
            <Grid item xs={12} sx={{mb: 2}}>
                {phases && phases.length > 0 &&
                    <RadioGroup name="tournament-phase" value={phase} row sx={{ml: 4}}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setPhase(parseInt((event.target as HTMLInputElement).value))}>
                        {phases.map(p => (
                            <FormControlLabel key={p} value={p}
                                              sx={{
                                                  p: 1,
                                                  borderRadius: 3,
                                                  fontTransform: 'uppercase',
                                                  backgroundColor: phase === p ? '#017d7f' : 'inherit',
                                                  ':hover': {
                                                      color: '#017d7f',
                                                      backgroundColor: 'inherit'
                                                  }
                                              }}
                                              control={<Radio sx={{display: "none"}}/>}
                                              label={t('tournament.phase', {phase: p})}
                            />
                        ))}
                    </RadioGroup>

                }
            </Grid>
        )
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
                                <Button variant="text"
                                        disabled={Date.parse(tournament.startDate).toString() > Date.now().toString()}
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.PLANNING ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.PLANNING)}>
                                    <CalendarMonthIcon sx={{mr: 1}}/>
                                    {t('tournament.display.planning')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Button variant="text"
                                        disabled={Date.parse(tournament.startDate).toString() > Date.now().toString()}
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.RESULTS ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.RESULTS)}>
                                    <EmojiEventsIcon sx={{mr: 1}}/>
                                    {t('tournament.display.results')}
                                </Button>
                                <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                                <Button variant="text"
                                    // TODO later some better condition here
                                        disabled={!phases.find(p => p === 2)}
                                        style={{...MenuButtonsStyle, ...(tab === Tabs.TREE ? ActiveMenuButtonsStyle : {})}}
                                        onClick={() => changeTab(Tabs.TREE)}>
                                    <AccountTreeIcon sx={{mr: 1}}/>
                                    {t('tournament.display.tree')}
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
                                                <Typography display="inline">R??glement</Typography>
                                            </a>
                                            <a href="https://static.ankama.com/upload/backoffice/direct/2022-10-07/Wakfu_Warriors_2022_Rules_pt-br.pdf"
                                               rel="noreferrer" target="_blank">
                                                <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                    <img src={`/flags/pt.svg`} alt={`flag_pt`}/>
                                                </Icon>
                                                <Typography display="inline">Regulamento</Typography>
                                            </a>
                                            <a href="https://static.ankama.com/upload/backoffice/direct/2022-10-10/Wakfu_Warriors_2022_Reglamento_es-es.pdf"
                                               rel="noreferrer" target="_blank">
                                                <div>
                                                    <Icon sx={{verticalAlign: "middle", mr: 1, mb: '6px'}}>
                                                        <img src={`/flags/es.svg`} alt={`flag_es`}/>
                                                    </Icon>
                                                    <Typography display="inline">Reglamento</Typography>
                                                </div>
                                            </a>
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
                                                    {tournament.referees.map(referees => (
                                                        <Typography key={referees}
                                                                    sx={{color: "#8299a1"}}>{[accounts.get(referees)].map(a => !a ? "" : a.username + "#" + a.discriminator)}</Typography>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    <Typography variant="h4" sx={{
                                                        textAlign: "start",
                                                        mb: 1
                                                    }}>{t('tournament.streamers')}</Typography>
                                                    {tournament.streamers.map(streamer => (
                                                        <Typography key={streamer}
                                                                    sx={{color: "#8299a1"}}>{[accounts.get(streamer)].map(a => !a ? "" : a.username + "#" + a.discriminator)}</Typography>
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
                                            <Card key={team.id} sx={{
                                                m: 3,
                                                borderRadius: 4,
                                                boxShadow: '5px 5px 15px 0px #000000',
                                                '.MuiCardContent-root': {p: 3}
                                            }}>
                                                <CardContent sx={{backgroundColor: "#162329", textAlign: "start"}}>
                                                    <Grid container alignItems="center">
                                                        <Grid item xs={12} lg={6}>
                                                            <Link to={`/tournament/${id}/tab/2/team/${team.id}`}>
                                                                <Typography display="inline"
                                                                            variant="h6"
                                                                            sx={{mr: 2}}>{team.name}</Typography>
                                                                <Typography display="inline"
                                                                            sx={{verticalAlign: "1px"}}><span
                                                                    className="blueWord">{team.server}</span></Typography>
                                                            </Link>
                                                        </Grid>
                                                        <Grid item xs={12} lg={4}>
                                                            <Divider sx={{
                                                                mr: 2, mt: 0, mb: 0,
                                                                display: {lg: "inline", xs: 'none'},
                                                                pt: 2, pb: 2
                                                            }}
                                                                     orientation="vertical" variant="middle" flexItem/>
                                                            <Typography display="inline" sx={{mr: 2}}><EmojiEventsIcon
                                                                sx={{
                                                                    verticalAlign: "middle",
                                                                    mr: 1,
                                                                    mb: '3px'
                                                                }}/>{t('tournament.nbVictories', {nb: team?.stats?.victories || 0})}
                                                            </Typography>
                                                            <Typography display="inline"
                                                                        sx={{color: "#8299a1", mr: 2}}><ListAltIcon
                                                                sx={{
                                                                    verticalAlign: "middle",
                                                                    mr: 1,
                                                                    mb: '3px'
                                                                }}/>{t('tournament.nbMatchesPlayed', {nb: team?.stats?.played || 0})}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12} lg={2}>
                                                            <Link to={`/tournament/${id}/tab/2/team/${team.id}`}>
                                                                <Button sx={{float: "right"}}
                                                                        onClick={() => goToTeam(team.id)}>{t('tournament.team.goTo')}</Button>
                                                            </Link>
                                                        </Grid>
                                                    </Grid>


                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Grid>
                                </Grid>
                            }

                            {tab === Tabs.SINGLE_TEAM && team &&
                                <Grid container>
                                    <Grid item lg={9} xs={12} sx={{textAlign: "start", pl: 4}}>
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

                                                {teamMatches && teamMatches.filter(m => !m.done).map(match => (
                                                    <TournamentTeamMatchView key={match.id} tournamentId={id || ""}
                                                                             match={match}
                                                                             displayedTeam={team.id}
                                                                             otherTeamName={teamsNamesPersistence.get(match.teamA === team.id ? match.teamB : match.teamA) || ""}
                                                                             goToMatch={() => loadMatch(match.id, true)}/>
                                                ))}

                                                {teamMatches && teamMatches.filter(m => !m.done).length <= 0 &&
                                                    <Typography sx={{ml: 2, mt: 2}}
                                                                variant="h6">{t('tournament.display.match.noNextMatches')}</Typography>
                                                }

                                                <Divider sx={{ml: 3, mr: 3, mt: 2, mb: 2}} variant="middle" flexItem/>

                                                <Typography variant="h5"
                                                            sx={{color: "#fefffa"}}>{t('tournament.display.results')}</Typography>

                                                {teamMatches && teamMatches.length > 0 && teamMatches.filter(m => m.done).map(match => (
                                                    <TournamentTeamMatchView key={match.id} tournamentId={id || ""}
                                                                             match={match}
                                                                             displayedTeam={team.id}
                                                                             otherTeamName={teamsNamesPersistence.get(match.teamA === team.id ? match.teamB : match.teamA) || ""}
                                                                             goToMatch={() => loadMatch(match.id, true)}/>
                                                ))}

                                                {teamMatches && teamMatches.filter(m => m.done).length <= 0 &&
                                                    <Typography sx={{ml: 2, mt: 2}}
                                                                variant="h6">{t('tournament.display.match.noMatchResult')}</Typography>
                                                }
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item lg={3} xs={12} sx={{pl: 3, pr: 3}}>
                                        <Stack spacing={2}>
                                            <Card>
                                                <CardContent
                                                    sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                    <Typography sx={{color: "#8299a1", mr: 2}}><ListAltIcon
                                                        sx={{
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            mb: '3px'
                                                        }}/>{t('tournament.nbMatchesPlayed', {nb: team?.stats?.played || 0})}
                                                    </Typography>
                                                    <Typography sx={{mr: 2, color: "#07c6b6"}}>
                                                        <EmojiEventsIcon sx={{
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            mb: '3px'
                                                        }}/>{t('tournament.nbVictories', {nb: team?.stats?.played || 0})}
                                                    </Typography>
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
                                            {team && team.stats && team.stats.statsByClass && team.stats.statsByClass.filter(b => b).length > 0 &&
                                                <Card>
                                                    <CardContent
                                                        sx={{backgroundColor: '#213943', textAlign: "start", pl: 3}}>
                                                        <Grid container>
                                                            {team.stats.statsByClass.filter(b => b).map(breed => (
                                                                <Grid item xs={4} lg={12} key={breed.id}>
                                                                    <Grid container alignItems="center">
                                                                        <Grid item xs={4}>
                                                                            <img src={`/classes/${breed.id}_0.png`}
                                                                                 style={{width: "100%"}}
                                                                                 alt={`Breed ${breed.id}`}/>
                                                                        </Grid>
                                                                        <Grid item xs={8}>
                                                                            <Tooltip
                                                                                title={t('tournament.display.match.stats.played')}
                                                                                placement="top">
                                                                                <Typography
                                                                                    display={breed.played ? "inline" : "none"}
                                                                                    sx={{
                                                                                        verticalAlign: "middle",
                                                                                        color: '#4be64b',
                                                                                        ml: 1
                                                                                    }}>
                                                                                    <VideogameAssetIcon sx={{
                                                                                        verticalAlign: "middle",
                                                                                        mb: "3px"
                                                                                    }}/> {breed.played}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                            <Tooltip
                                                                                title={t('tournament.display.match.stats.banned')}
                                                                                placement="top">
                                                                                <Typography
                                                                                    display={breed.banned ? "inline" : "none"}
                                                                                    sx={{
                                                                                        verticalAlign: "middle",
                                                                                        color: '#e64b4b',
                                                                                        ml: 1
                                                                                    }}>
                                                                                    <VideogameAssetOffIcon sx={{
                                                                                        verticalAlign: "middle",
                                                                                        mb: "3px"
                                                                                    }}/> {breed.banned}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                            <br/>
                                                                            <Tooltip
                                                                                title={t('tournament.display.match.stats.victories')}
                                                                                placement="top">
                                                                                <Typography
                                                                                    display={breed.victories ? "inline" : "none"}
                                                                                    sx={{
                                                                                        verticalAlign: "middle",
                                                                                        color: '#07c6b6',
                                                                                        ml: 1
                                                                                    }}>
                                                                                    <EmojiEventsIcon sx={{
                                                                                        verticalAlign: "middle",
                                                                                        mb: "3px"
                                                                                    }}/> {breed.victories}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                            <Tooltip
                                                                                title={t('tournament.display.match.stats.killed')}
                                                                                placement="top">
                                                                                <Typography
                                                                                    display={breed.killed ? "inline" : "none"}
                                                                                    sx={{
                                                                                        verticalAlign: "middle",
                                                                                        color: '#C50756',
                                                                                        ml: 1
                                                                                    }}>
                                                                                    <SportsMmaIcon sx={{
                                                                                        verticalAlign: "middle",
                                                                                        mb: "3px"
                                                                                    }}/> {breed.killed}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                            <Tooltip
                                                                                title={t('tournament.display.match.stats.death')}
                                                                                placement="top">
                                                                                <Typography
                                                                                    display={breed.death ? "inline" : "none"}
                                                                                    sx={{
                                                                                        verticalAlign: "middle",
                                                                                        color: "#8299a1",
                                                                                        ml: 1
                                                                                    }}>
                                                                                    <HealingIcon sx={{
                                                                                        verticalAlign: "middle",
                                                                                        mb: "3px"
                                                                                    }}/> {breed.death}
                                                                                </Typography>
                                                                            </Tooltip>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                            }
                                        </Stack>
                                    </Grid>
                                </Grid>
                            }

                            {(tab === Tabs.PLANNING) &&
                                <Grid container>
                                    <Grid item xs={12} sx={{mb: 2}}>
                                        <Typography
                                            variant="h4">{t('tournament.display.' + (tab === Tabs.PLANNING ? "planning" : "results"))}</Typography>
                                    </Grid>
                                    <PhaseButton/>
                                    {planningToDisplay && planningToDisplay.length > 0 &&
                                        <TournamentMatchPlanningListView data={{
                                            tournament: tournament,
                                            teams: teamsNamesPersistence,
                                            matches: planningToDisplay,
                                            goToMatch: (matchId) => loadMatch(matchId, true)
                                        }}/>
                                    }

                                    {(!planningToDisplay || planningToDisplay.length <= 0) &&
                                        <Grid item xs={12}>
                                            <Typography
                                                variant="h5">{t('tournament.display.noMatchPlanned')}</Typography>
                                        </Grid>
                                    }
                                </Grid>
                            }

                            {(tab === Tabs.RESULTS) &&
                                <Grid container>
                                    <Grid item xs={12} sx={{mb: 2}}>
                                        <Typography
                                            variant="h4">{t('tournament.display.results')}</Typography>
                                    </Grid>
                                    <PhaseButton/>
                                    {resultToDisplay && resultToDisplay.length > 0 &&
                                        <WakfuWarriorsMatchResultListView data={{
                                            tournament: tournament,
                                            teams: teamsNamesPersistence,
                                            matches: resultToDisplay,
                                            goToMatch: (matchId) => loadMatch(matchId, true)
                                        }}/>
                                    }

                                    {(!resultToDisplay || resultToDisplay.length <= 0) &&
                                        <Grid item xs={12}>
                                            <Typography
                                                variant="h5">{t('tournament.display.noMatchPlanned')}</Typography>
                                        </Grid>
                                    }
                                </Grid>
                            }

                            {tab === Tabs.MATCH && currentMatch &&
                                <TournamentMatchView data={{
                                    accounts: accounts,
                                    me: me || "",
                                    teams: teamsNamesPersistence,
                                    streamers: streamers,
                                    tournament: tournament,
                                    currentMatch: currentMatch,
                                    addStreamer: (id: string, data: any) => {
                                        streamerPersistence.set(id, data)
                                        setStreamers(streamerPersistence)
                                    }
                                }}
                                />

                            }

                            {tab === Tabs.TREE && allMatches &&
                                <WakfuWarriorsTreeView data={{
                                    teams: teamsNamesPersistence,
                                    matches: allMatches,
                                    goToMatch: (matchId) => loadMatch(matchId, true)
                                }}
                                />

                            }

                        </Grid>
                    </Grid>
                </div>
            }
        </Grid>
    )
}