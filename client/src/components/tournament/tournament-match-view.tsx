import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import {TournamentDefinition, TournamentMatchModel, TournamentMatchRoundModel} from "../../utils/tournament-models";
import {useTranslation} from "react-i18next";
import React, {ChangeEvent, SyntheticEvent, useContext, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import {
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Grid,
    Icon,
    styled,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {Link, useNavigate, useParams} from "react-router-dom";
import {DraftTeam} from "../../utils/draft-controller";
import {UserContext} from "../../context/user-context";

type PropsTypes = {
    accounts: Map<string, any>;
    me: string;
    teams: Map<string, any>;
    streamers: Map<string, any>;
    tournament: TournamentDefinition;
    currentMatch: TournamentMatchModel;
    addStreamer(id: string, data: any): void
}

const dateFormat = {
    date: {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }
}

export default function TournamentMatchView({data}: { data: PropsTypes }) {
    const {
        accounts,
        me,
        teams,
        streamers,
        tournament,
        currentMatch,
        addStreamer
    } = data;
    const {id} = useParams();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const socket = useContext(SocketContext)
    const userContext = useContext(UserContext)

    const [tab, setTab] = useState(0);
    const [match, setMatch] = useState(currentMatch)
    const [fight, setFight] = useState(currentMatch.rounds[tab]);
    const [currentMatchDate, setCurrentMatchDate] = useState<string>();
    const [currentDraftDate, setCurrentDraftDate] = useState<string | null>(fight.draftDate || null);
    const [statEditMode, setStatEditMode] = useState<boolean>(false);
    const [stats, setStats] = useState<any[]>([undefined, {
        turns: fight.teamAStats?.turns || 0,
        killedBreeds: fight.teamAStats ? fight.teamAStats.killedBreeds : [],
        killerBreeds: fight.teamAStats ? fight.teamAStats.killerBreeds : []
    }, {
        turns: fight.teamBStats?.turns || 0,
        killedBreeds: fight.teamBStats ? fight.teamBStats.killedBreeds : [],
        killerBreeds: fight.teamBStats ? fight.teamBStats.killerBreeds : []
    }]);

    function setDraftDate(draftDate: string | null | undefined) {
        if (!draftDate) return;
        setCurrentDraftDate((draftDate as any).toISOString())
    }

    function validateDraftDate() {
        socket.emit('tournament::referee:setDraftDate', tournament.id, match.id, tab, currentDraftDate, (done: boolean) => {
            if (done) {
                setFight({
                    ...fight,
                    draftDate: currentDraftDate
                } as any)
            }
        })
    }

    function setFightWinner(team: string) {
        socket.emit('tournament::referee:setFightWinner', tournament.id, match.id, tab, team, (done: boolean) => {
            if (done) {
                setFight({
                    ...fight,
                    winner: team
                } as any)
            }
        })
    }

    function setFightDraftFirstPicker(team: string) {
        socket.emit('tournament::referee:setFightDraftFirstPicker', tournament.id, match.id, tab, team, (done: boolean) => {
            if (done) {
                setFight({
                    ...fight,
                    draftFirstPicker: team
                })
            }
        })
    }

    function rerollFightMap(matchId: string | undefined) {
        socket.emit('tournament::admin:rerollMap', tournament.id, matchId, tab, (done: boolean) => {
            if (done) {
                window.location.reload();
            }
        })
    }

    function setFightStats(matchId: string | undefined) {
        socket.emit('tournament::referee:setFightStats', tournament.id, matchId, tab, stats, (done: boolean) => {
            if (done) {
                window.location.reload();
            }
        })
    }

    function setMatchDate(matchDate: string | null | undefined) {
        if (!matchDate) return;
        setCurrentMatchDate((matchDate as any).toISOString())
    }

    function validateMatchDate(matchId: string | undefined) {
        socket.emit('tournament::referee:setMatchDate', tournament.id, matchId, currentMatchDate, (done: boolean) => {
            if (done) {
                setMatch({
                    ...match,
                    date: currentMatchDate
                } as TournamentMatchModel)
            }
        })
    }

    function setReferee(matchId: string | undefined) {
        socket.emit('tournament::referee:setReferee', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setMatch({
                    ...match,
                    referee: me
                } as TournamentMatchModel)
            }
        })
    }

    function setWinner(matchId: string | undefined, team: string) {
        socket.emit('tournament::referee:setWinner', tournament.id, matchId, team, (done: boolean) => {
            if (done) {
                setMatch({
                    ...match,
                    winner: team
                } as TournamentMatchModel)
            }
        })
    }

    function validateMatch(matchId: string | undefined) {
        socket.emit('tournament::referee:validateMatch', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setMatch({
                    ...match,
                    done: true
                } as TournamentMatchModel)
            }
        })
    }

    function removeStreamer(matchId: string | undefined) {
        socket.emit('tournament::admin:removeMatchStreamer', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setMatch({
                    ...match,
                    streamer: undefined
                } as TournamentMatchModel)
            }
        })
    }

    function setStreamer(matchId: string | undefined) {
        socket.emit('tournament::streamer:setMatchStreamer', tournament.id, matchId, (done: boolean) => {
            if (done) {
                if (!streamers.has(me || "")) {
                    socket.emit('account::getStreamer', me, (streamer: any) => {
                        addStreamer(streamer.id, streamer);
                        setMatch({
                            ...match,
                            streamer: me
                        } as TournamentMatchModel)
                    })
                    return;
                }
                setMatch({
                    ...match,
                    streamer: me
                } as TournamentMatchModel)
            }
        })
    }

    function matchText() {
        const result: string[] = [];
        if (match.pool !== undefined) {
            // TODO later : clean this
            result.push(t('tournament.display.match.pool', {pool: match.pool + (match.phase === 1 ? 1 : 0)}))
        }
        if (match.round) {
            result.push(t('tournament.display.match.round', {round: match.round}))
        }

        const phase = tournament.phases.find(p => p.phase === match.phase);
        if (phase) {
            const round = phase.roundModel.find(r => r.round === match.round)
            result.push(t('tournament.display.match.bo', {nb: round?.bo || 1}))
        }
        return result.join(" - ")
    }

    const onTabChange = (event: SyntheticEvent, newTab: number) => {
        setFight(match.rounds[newTab])
        setCurrentDraftDate(match.rounds[newTab].draftDate || null)
        setTab(newTab);
    }

    const startDraft = (sidePick: DraftTeam | undefined) => {
        socket.emit('tournament::draftStart', tournament.id, match.id, tab, sidePick, (isValid: boolean) => {
            if (!isValid) return;
            navigate(`/draft/${match.id}_${tab}`)
        })
    }

    const TeamColumn = ({fight, team}: { fight: TournamentMatchRoundModel, team: DraftTeam }) => {
        const appropriateTeam = team === DraftTeam.TEAM_A ? match.teamA : match.teamB;
        const appropriateDraft = team === DraftTeam.TEAM_A ? fight.teamADraft : fight.teamBDraft;
        const otherTeam = team === DraftTeam.TEAM_A ? match.teamB : match.teamA;
        return (
            <Grid item xs={6}>
                <Grid container>
                    <Grid item xs={12}>
                        {fight.winner === appropriateTeam &&
                            <EmojiEventsIcon sx={{
                                height: '60px',
                                width: '60px',
                                verticalAlign: "middle",
                                color: "#07c6b6"
                            }}/>
                        }
                        {fight.winner === otherTeam &&
                            <CancelIcon sx={{
                                height: '60px',
                                width: '60px',
                                verticalAlign: "middle",
                                color: "#e64b4b"
                            }}/>
                        }
                    </Grid>
                    <Grid item xs={12}>

                        <Link to={`/tournament/${id}/tab/2/team/${appropriateTeam}`}>
                            {fight.draftTeamA === appropriateTeam &&
                                <Tooltip title={t('tournament.display.match.draft.teamA')} placement="top">
                                    <LooksOneIcon sx={{verticalAlign: "middle", mb: "3px", mr: 1, color: "#8299a1"}}/>
                                </Tooltip>
                            }
                            <Typography display="inline">
                                <b>{teams.get(appropriateTeam)}</b></Typography>
                        </Link>
                    </Grid>
                    <Grid item xs={12} sx={{p: 3}}>
                        <Grid container>
                            {appropriateDraft && appropriateDraft.pickedClasses && appropriateDraft.pickedClasses.map(c => (
                                <Grid item xs={4} key={c}>
                                    <img src={`/classes/${c}_0.png`} style={{width: "100%"}} alt={`Breed ${c}`}/>

                                    {match.referee === me && statEditMode &&
                                        <FormGroup>
                                            <FormControlLabel
                                                control={<Checkbox onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                    const s = [...stats];
                                                    s[team].killedBreeds[c] = event.target.checked;
                                                    setStats(s)
                                                }} checked={stats[team].killedBreeds[c] === true}/>}
                                                label={t('tournament.display.match.dead')}/>
                                            <TextField label={t('tournament.display.match.killed')}
                                                       type="number"
                                                       value={stats[team].killerBreeds[c] || 0}
                                                       onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                           const s = [...stats];
                                                           s[team].killerBreeds[c] = event.target.value || 0;
                                                           setStats(s);
                                                       }}
                                            />
                                        </FormGroup>
                                    }
                                </Grid>
                            ))}

                            {match.referee === me && statEditMode &&
                                <TextField label={t('tournament.display.match.turnNumber')} sx={{mt: 1}}
                                           type="number"
                                           value={stats[team].turns || 0}
                                           onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                               const s = [...stats];
                                               s[team].turns = event.target.value || 0;
                                               setStats(s);
                                           }}
                                />
                            }
                        </Grid>
                        <Grid container sx={{p: 3}}>
                            {appropriateDraft && appropriateDraft.bannedClasses && appropriateDraft.bannedClasses.map(c => (
                                <Grid item xs={4} key={c}>
                                    <img src={`/classes/${c}_0.png`} style={{width: "100%", filter: "grayscale(1)"}}
                                         alt={`Breed ${c}`}/>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        )
    }

    return (
        <Grid container>
            <Grid item xs={12} sx={{mt: 3}}>
                <Typography variant="h4" display="inline" sx={{color: "#fefffa"}}>
                    {match.winner === match.teamA &&
                        <EmojiEventsIcon sx={{
                            mr: 1,
                            mb: "3px",
                            height: '80px', width: '80px',
                            verticalAlign: "middle",
                            color: "#07c6b6"
                        }}/>
                    }
                    {match.winner === match.teamB &&
                        <CancelIcon sx={{
                            mr: 1,
                            mb: "3px",
                            height: '80px', width: '80px',
                            verticalAlign: "middle",
                            color: "#e64b4b"
                        }}/>
                    }
                    <Link to={`/tournament/${id}/tab/2/team/${match.teamA}`}>
                        {teams.get(match.teamA)}
                    </Link>
                </Typography>
                <Typography variant="h5" display="inline" className="blueWord" sx={{ml: 1, mr: 1}}>vs</Typography>
                <Typography variant="h4" display="inline" sx={{color: "#fefffa"}}>
                    <Link to={`/tournament/${id}/tab/2/team/${match.teamB}`}>
                        {teams.get(match.teamB)}
                    </Link>
                    {match.winner === match.teamB &&
                        <EmojiEventsIcon sx={{
                            ml: 1,
                            mb: "3px",
                            height: '80px', width: '80px',
                            verticalAlign: "middle",
                            color: "#07c6b6"
                        }}/>
                    }
                    {match.winner === match.teamA &&
                        <CancelIcon sx={{
                            ml: 1,
                            mb: "3px",
                            height: '80px', width: '80px',
                            verticalAlign: "middle",
                            color: "#e64b4b"
                        }}/>
                    }
                </Typography>
                <Typography variant="h6" color="#8299a1">{match.date
                    ? t('date', {
                        date: Date.parse(match.date), formatParams: dateFormat
                    })
                    : t('tournament.display.match.noDate')}
                </Typography>
                <Typography sx={{
                    margin: "auto", mt: 2, mb: 3,
                    borderRadius: 3, backgroundColor: "#017d7f",
                    p: 1, pl: 3, pr: 3
                }} display="inline-block">
                    {matchText()}
                </Typography>
            </Grid>
            <Grid item xs={12} sx={{pr: 2, backgroundColor: '#162329', borderRadius: 3, ml: 2, mr: 2}}>
                <Tabs value={tab} onChange={onTabChange}>
                    {match.rounds && match.rounds.map((round, index) => (
                        <StyledTab key={index} label={t('tournament.display.match.matchNb', {nb: index + 1})}/>
                    ))}
                </Tabs>
                <Grid container>
                    <Grid item xs={8} sx={{
                        display: "flex",
                        alignItems: fight.teamADraft ? "start" : "center",
                        justifyContent: "center"
                    }}>
                        {/*TODO v2 bind draft link & draft results & winner */}
                        <Grid container>
                            <Grid item xs={12}>
                                {((!fight.teamADraft && fight.draftDate && Date.parse(fight.draftDate).toString() < Date.now().toString() && (!fight.draftFirstPicker && (match.teamA === userContext.userState.myTeam || match.teamB === userContext.userState.myTeam))) || (fight.draftId && !fight.teamADraft)) &&
                                    <Button sx={{width: "50%", pt: 2, pb: 2}} disabled={!fight.draftDate}
                                            onClick={() => startDraft(undefined)}>
                                        {t('tournament.display.match.goToDraft')}
                                    </Button>
                                }
                                {fight.draftFirstPicker && !fight.draftId && !fight.teamADraft && fight.draftDate && Date.parse(fight.draftDate).toString() < Date.now().toString() && fight.draftFirstPicker === userContext.userState.myTeam &&
                                    <>
                                        <Button sx={{width: "40%", pt: 2, pb: 2, mr: 1}} disabled={!fight.draftDate}
                                                onClick={() => startDraft(DraftTeam.TEAM_A)}>
                                            {t('tournament.display.match.goToDraftTeamA')}
                                        </Button>
                                        <Button sx={{width: "40%", pt: 2, pb: 2, ml: 1}} disabled={!fight.draftDate}
                                                onClick={() => startDraft(DraftTeam.TEAM_B)}>
                                            {t('tournament.display.match.goToDraftTeamB')}
                                        </Button>
                                    </>
                                }
                                {!fight.teamADraft && !fight.draftDate &&
                                    <Typography
                                        variant="h5">{t('tournament.display.match.draftNotAvailableYet')}</Typography>
                                }
                                {!fight.teamADraft && ((fight.draftDate && !fight.draftId && ((match.teamA !== userContext.userState.myTeam && match.teamB !== userContext.userState.myTeam && !fight.draftFirstPicker)
                                        || (fight.draftFirstPicker && fight.draftFirstPicker !== userContext.userState.myTeam)))) &&
                                    <Typography
                                        variant="h5">{t('tournament.display.match.draftNotStartedYet')}</Typography>
                                }
                                {!fight.teamADraft && fight.draftDate && Date.parse(fight.draftDate).toString() > Date.now().toString() &&
                                    <Typography variant="h5">{t('tournament.display.match.draftDate', {
                                        date: Date.parse(fight.draftDate),
                                        formatParams: dateFormat
                                    })}</Typography>
                                }
                                {fight.teamADraft &&
                                    <Grid container>
                                        <TeamColumn fight={fight} team={DraftTeam.TEAM_A}/>
                                        <TeamColumn fight={fight} team={DraftTeam.TEAM_B}/>
                                    </Grid>
                                }
                            </Grid>

                            {match.referee === me &&
                                <Grid item xs={12}>
                                    <Grid item xs={12}>
                                        <Button sx={{width: "30%", mt: 1, mr: 1}}
                                                onClick={() => setStatEditMode(!statEditMode)}>{t('tournament.display.match.editFightStatsMode')}</Button>
                                        <Button sx={{width: "30%", mt: 1, ml: 1}}
                                                onClick={() => setFightStats(match.id)}>{t('tournament.display.match.editFightStats')}</Button>
                                    </Grid>
                                </Grid>
                            }
                        </Grid>
                    </Grid>
                    <Grid item xs={4}>
                        {fight.teamAStats &&
                            <Card sx={{backgroundColor: '#017d7f', borderRadius: 3, mb: 2}}>
                                <CardContent sx={{
                                    "&:last-child": {
                                        pb: 2
                                    }
                                }}>
                                    <Typography textAlign="start"
                                                variant="h6"><b>{t('tournament.display.match.fightTurns', {nb: fight.teamAStats.turns})}</b></Typography>
                                </CardContent>
                            </Card>
                        }

                        <Card sx={{backgroundColor: '#213943', borderRadius: 3, mb: 2, textAlign: "start"}}>
                            <CardContent sx={{
                                "&:last-child": {
                                    pb: 2
                                }
                            }}>
                                <Typography variant="h5" display="inline">{t(`maps.${fight.map}`)}</Typography>
                                <img src={`/maps/${fight.map}.jpg`} alt={`Map ${fight.map}`}
                                     style={{width: "100%", borderRadius: 6, marginTop: 8}}/>

                                {tournament.admins.includes(me || "") &&
                                    <Button sx={{backgroundColor: "#e64b4b", width: "100%", mt: 1}}
                                            onClick={() => rerollFightMap(match.id)}>{t('tournament.display.match.rerollMap')}</Button>
                                }
                            </CardContent>
                        </Card>
                        <Card sx={{backgroundColor: '#213943', borderRadius: 3, textAlign: "start", mb: 2}}>
                            <CardContent sx={{
                                "&:last-child": {
                                    pb: 2
                                }
                            }}>
                                <Typography variant="h4"
                                            display="inline">{t("tournament.display.match.live")}</Typography>
                                <Typography
                                    sx={{
                                        color: "#8299a1",
                                        mb: 2,
                                        mt: 2
                                    }}>{match.streamer ? [accounts.get(match.streamer || "")].map(a => !a ? "" : a.username + "#" + a.discriminator) : t('tournament.display.match.noStreamer')}</Typography>
                                {match.streamer && streamers.get(match.streamer || "") && streamers.get(match.streamer || "").twitchUrl &&
                                    <a href={streamers.get(match.streamer || "").twitchUrl} rel="noreferrer"
                                       target="_blank">
                                        <Button sx={{backgroundColor: "#6441A5", width: "100%"}}>
                                            <Icon sx={{mr: 1, position: "relative", top: "-2px", zIndex: 0}}>
                                                <img style={{width: "24px", height: "30px"}} src='/images/twitch.svg'
                                                     alt="Twitch icon"/>
                                            </Icon>
                                            {t('tournament.display.match.watchStream')}
                                        </Button>
                                    </a>
                                }
                                {tournament.streamers.includes(me || "") && !match.streamer &&
                                    <Button sx={{backgroundColor: "#6441A5", width: "100%", mt: 1}}
                                            onClick={() => setStreamer(match.id)}>{t('tournament.display.match.setMeAsStreamer')}</Button>
                                }
                                {tournament.admins.includes(me || "") && match.streamer &&
                                    <Button sx={{backgroundColor: "#e64b4b", width: "100%", mt: 1}}
                                            onClick={() => removeStreamer(match.id)}>{t('tournament.display.match.setNullAsStreamer')}</Button>
                                }
                            </CardContent>
                        </Card>
                        <Card sx={{backgroundColor: '#213943', borderRadius: 3, textAlign: "start", mb: 2}}>
                            <CardContent sx={{
                                "&:last-child": {
                                    pb: 2
                                }
                            }}>
                                <Typography variant="h4">{t('tournament.display.match.arbitration')}</Typography>
                                <Typography color="#8299a1"
                                            sx={{mt: 2}}>{match.referee ? [accounts.get(match.referee || "")].map(a => a.username + "#" + a.discriminator) : t('tournament.display.match.noReferee')}</Typography>

                                {match.referee && match.referee === me &&
                                    <Grid container sx={{mt: 2}}>
                                        <Grid item xs={12}>
                                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                                <DateTimePicker
                                                    label={t('tournament.startDate')}
                                                    value={currentDraftDate}
                                                    onChange={(value, ignored) => setDraftDate(value)}
                                                    renderInput={(params) => <TextField {...params} />}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}} onClick={validateDraftDate}>
                                                {t('tournament.display.match.buttonSetDraftDate')}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}}
                                                    onClick={() => setFightDraftFirstPicker(match.teamA)}>
                                                {t('tournament.display.match.buttonSetFightDraftFirstPicker', {name: teams.get(match.teamA)})}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}}
                                                    onClick={() => setFightDraftFirstPicker(match.teamB)}>
                                                {t('tournament.display.match.buttonSetFightDraftFirstPicker', {name: teams.get(match.teamB)})}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}}
                                                    onClick={() => setFightWinner(match.teamA)}>
                                                {t('tournament.display.match.buttonSetFightWinnerTeam', {name: teams.get(match.teamA)})}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}}
                                                    onClick={() => setFightWinner(match.teamB)}>
                                                {t('tournament.display.match.buttonSetFightWinnerTeam', {name: teams.get(match.teamB)})}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                }
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>
            {tournament.referees.includes(me || "") &&
                <Grid item xs={12} sx={{mt: 2}}>
                    <Card sx={{pr: 2, backgroundColor: '#162329', borderRadius: 3, ml: 2, mr: 2}}>
                        <CardContent>
                            <Grid container>
                                <Grid item xs={4}>
                                    <Button sx={{m: 1, width: "90%"}}
                                            onClick={() => setReferee(match.id)}>{t('tournament.display.match.buttonSetMatchReferee')}</Button>
                                </Grid>
                                <Grid item xs={4}>
                                    <LocalizationProvider dateAdapter={AdapterMoment}>
                                        <DateTimePicker
                                            label={t('tournament.startDate')}
                                            value={currentMatchDate || match.date}
                                            onChange={(value, ignored) => setMatchDate(value)}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={4}>
                                    <Button sx={{m: 1, width: "90%"}} onClick={() => validateMatchDate(match.id)}>
                                        {t('tournament.display.match.buttonSetMatchDate')}
                                    </Button>
                                </Grid>
                                <Grid item xs={4}>
                                    <Button sx={{m: 1, width: "90%"}} onClick={() => setWinner(match.id, match.teamA)}>
                                        {t('tournament.display.match.buttonSetMatchWinnerTeam', {name: teams.get(match.teamA)})}
                                    </Button>
                                </Grid>
                                <Grid item xs={4}>

                                    <Button sx={{m: 1, width: "90%"}} onClick={() => setWinner(match.id, match.teamB)}>
                                        {t('tournament.display.match.buttonSetMatchWinnerTeam', {name: teams.get(match.teamB)})}
                                    </Button>
                                </Grid>
                                <Grid item xs={4}>
                                    <Button sx={{m: 1, width: "90%"}} onClick={() => validateMatch(match.id)}
                                            disabled={match.done}>
                                        {t('tournament.display.match.validateMatch')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            }
        </Grid>
    )
}

const StyledTab = styled((props: { label: string }) => (<Tab {...props} />))(({theme}) => ({
    '&.Mui-selected': {
        color: '#03c8be',
        backgroundColor: '#0d1518',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    '&.Mui-focusVisible': {
        backgroundColor: '#03c8be',
    },

}));