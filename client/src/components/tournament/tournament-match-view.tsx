import {TournamentDefinition, TournamentMatchModel} from "../../../../common/tournament/tournament-models";
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
    const [match, setCurrentMatch] = useState(currentMatch)
    const [fight, setFight] = useState(currentMatch.rounds[tab]);
    const [currentMatchDate, setCurrentMatchDate] = useState<string>();

    function setMatchDate(matchDate: string | null | undefined) {
        if (!matchDate) return;
        setCurrentMatchDate((matchDate as any).toISOString())
    }

    function validateMatchDate(matchId: string | undefined) {
        socket.emit('tournament::referee:setMatchDate', tournament.id, matchId, currentMatchDate, (done: boolean) => {
            if (done) {
                setCurrentMatch({
                    ...match,
                    date: currentMatchDate
                } as TournamentMatchModel)
            }
        })
    }

    function setReferee(matchId: string | undefined) {
        socket.emit('tournament::referee:setReferee', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setCurrentMatch({
                    ...match,
                    referee: me
                } as TournamentMatchModel)
            }
        })
    }

    function setWinner(matchId: string | undefined, team: string) {
        socket.emit('tournament::referee:setWinner', tournament.id, matchId, team, (done: boolean) => {
            if (done) {
                setCurrentMatch({
                    ...match,
                    winner: team
                } as TournamentMatchModel)
            }
        })
    }

    function validateMatch(matchId: string | undefined) {
        socket.emit('tournament::referee:validateMatch', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setCurrentMatch({
                    ...match,
                    done: true
                } as TournamentMatchModel)
            }
        })
    }

    function removeStreamer(matchId: string | undefined) {
        socket.emit('tournament::admin:removeMatchStreamer', tournament.id, matchId, (done: boolean) => {
            if (done) {
                setCurrentMatch({
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
                        setCurrentMatch({
                            ...match,
                            streamer: me
                        } as TournamentMatchModel)
                    })
                    return;
                }
                setCurrentMatch({
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
                        date: Date.parse(match.date), formatParams: {
                            date: {
                                year: 'numeric', month: 'long', day: 'numeric',
                                hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
                            }
                        }
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
                        {/*TODO v2 bind link*/}
                        <Button sx={{width: "50%", pt: 2, pb: 2}}>
                            {t('tournament.display.match.goToDraft')}
                        </Button>
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
                                <img src={`/maps/${fight.map}.jpg`} alt={`Image of map ${fight.map}`}
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
                                            <Icon sx={{mr: 1}}>
                                                <img style={{width: "24px", height: "24px"}} src='/images/twitch.png'
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
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} sx={{mt: 2}}>
                Team A : {teams.get(match.teamA)} - Team B : {match.teamB} - Rounds
                : {JSON.stringify(match.rounds)} - Date : {match.date} - Done
                : {match.done ? "Y" : "N"}<br/>
                Winner : {match.winner} - Round : {match.round} - Pool
                : {match.pool}<br/>
                Referee
                : {match.referee ? [accounts.get(match.referee || "")].map(a => a.username + "#" + a.discriminator) : "TODO v2 no referee"}<br/>
            </Grid>
            {tournament.admins.includes(me || "") &&
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            Actions admin
                            <Button onClick={() => removeStreamer(match.id)}>Retirer
                                streamer</Button>
                        </CardContent>
                    </Card>
                </Grid>
            }
            {tournament.referees.includes(me || "") &&
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            Actions arbitre

                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    label={t('tournament.startDate')}
                                    value={match.date}
                                    onChange={(value, ignored) => setMatchDate(value)}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                            <Button
                                onClick={() => validateMatchDate(match.id)}>Set match
                                date</Button>
                            <Button
                                onClick={() => setReferee(match.id)}>Met set
                                referee</Button>
                            <Button
                                onClick={() => setWinner(match.id, match.teamA)}>Team
                                A winner</Button>
                            <Button
                                onClick={() => setWinner(match.id, match.teamB)}>Team
                                B winner</Button>
                            <Button onClick={() => validateMatch(match.id)}>Valider
                                match</Button>
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