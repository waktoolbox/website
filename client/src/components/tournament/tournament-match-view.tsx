import {TournamentDefinition, TournamentMatchModel} from "../../utils/tournament-models";
import {useTranslation} from "react-i18next";
import React, {SyntheticEvent, useContext, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import {Button, Card, CardContent, Grid, Icon, styled, Tab, Tabs, TextField, Typography} from "@mui/material";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";

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
    const {t} = useTranslation();
    const socket = useContext(SocketContext)

    const [tab, setTab] = useState(0);
    const [match, setMatch] = useState(currentMatch)
    const [fight, setFight] = useState(currentMatch.rounds[tab]);
    const [currentMatchDate, setCurrentMatchDate] = useState<string>();
    const [currentDraftDate, setCurrentDraftDate] = useState<string | null>(fight.draftDate || null);

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
        if (match.pool) {
            result.push(t('tournament.display.match.pool', {pool: match.pool}))
        }
        if (match.round) {
            result.push(t('tournament.display.match.round', {round: match.round}))
        }
        return result.join(" - ")
    }

    const onTabChange = (event: SyntheticEvent, newTab: number) => {
        setFight(match.rounds[newTab])
        setCurrentDraftDate(match.rounds[newTab].draftDate || null)
        setTab(newTab);
    }

    // @ts-ignore
    return (
        <Grid container>
            <Grid item xs={12} sx={{mt: 3}}>
                <Typography variant="h5" display="inline" sx={{color: "#fefffa"}}>{teams.get(match.teamA)}</Typography>
                <Typography variant="h6" display="inline" className="blueWord" sx={{ml: 1, mr: 1}}>vs</Typography>
                <Typography variant="h5" display="inline" sx={{color: "#fefffa"}}>{teams.get(match.teamB)}</Typography>
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
                    <Grid item xs={8} sx={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                        {/*TODO v2 bind draft link & draft results & winner */}
                        <Grid container>
                            <Grid item xs={12}>
                                {fight.draftDate && Date.parse(fight.draftDate).toString() < Date.now().toString() &&
                                    <Button sx={{width: "50%", pt: 2, pb: 2}} disabled={!fight.draftDate}>
                                        {t('tournament.display.match.goToDraft')}
                                    </Button>
                                }
                                {!fight.draftDate &&
                                    <Typography
                                        variant="h5">{t('tournament.display.match.draftNotAvailableYet')}</Typography>
                                }
                                {fight.draftDate && Date.parse(fight.draftDate).toString() > Date.now().toString() &&
                                    <Typography variant="h5">{t('tournament.display.match.draftDate', {
                                        date: Date.parse(fight.draftDate),
                                        formatParams: dateFormat
                                    })}</Typography>
                                }
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={4}>
                        <Card sx={{backgroundColor: '#017d7f', borderRadius: 3, mb: 2}}>
                            {/*TODO v2 stats */}
                            <CardContent sx={{
                                "&:last-child": {
                                    pb: 2
                                }
                            }}>
                                {t('coming.soon')}
                            </CardContent>
                        </Card>
                        <Card sx={{backgroundColor: '#213943', borderRadius: 3, mb: 2, textAlign: "start"}}>
                            <CardContent sx={{
                                "&:last-child": {
                                    pb: 2
                                }
                            }}>
                                <Typography variant="h5" display="inline">{t(`maps.${fight.map}`)}</Typography>
                                <img src={`/maps/${fight.map}.jpg`} alt={`Map ${fight.map}`}
                                     style={{width: "100%", borderRadius: 6, marginTop: 8}}/>
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
                                    <a href={streamers.get(match.streamer || "").twitchUrl}>
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
                                                    onClick={() => setFightWinner(match.teamA)}>
                                                {t('tournament.display.match.buttonSetFightWinnerTeam', {name: teams.get(match.teamA)})}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button sx={{mt: 1, width: "100%"}}
                                                    onClick={() => setFightWinner(match.teamA)}>
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
                                    <Button sx={{m: 1, width: "90%"}} onClick={() => validateMatch(match.id)}>
                                        Valider match
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