import {TournamentMatchModel} from "../../../utils/tournament-models";
import {useTranslation} from "react-i18next";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import React, {ReactNode, useEffect, useState} from "react";
import {Button, Card, CardContent, Grid, Typography} from "@mui/material";
import {Bracket, IRenderSeedProps, IRoundProps, Seed, SeedItem, SeedTeam} from "react-brackets";

type PropsTypes = {
    teams: Map<string, any>;
    matches: TournamentMatchModel[];
    goToMatch: (matchId: string) => void;
}

const dateFormat = {
    date: {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }
}

export default function WakfuWarriorsTreeView({data}: { data: PropsTypes }) {
    const {
        teams,
        matches,
        goToMatch
    } = data;
    const {t} = useTranslation();

    const [bracketsMatches, setBracketsMatches] = useState<IRoundProps[]>();

    useEffect(() => {
        const rounds: IRoundProps[] = [];
        const expectedInRounds: number[] = [0, 16, 8, 4, 2, 1];
        const seenInRounds: number[] = [];
        for (let i = 1; i < 6; i++) {
            rounds[i] = {
                title: t(`tournament.display.bracket.round.${i}`),
                seeds: []
            }
            seenInRounds[i] = 0;
        }
        matches.forEach(match => {
            if (!match.round) return;

            if (match.round === 5 && match.pool === 2) {
                // TODO later code myself a nice display solution
                return; // do not display 3rd/4th because the lib doesn't manage it well
            }

            seenInRounds[match.round]++;
            rounds[match.round].seeds.push({
                id: match.id || "",
                date: match.date,
                maps: match.rounds.map(f => f.map),
                teams: [
                    {
                        name: teams.get(match.teamA),
                        winner: match.winner === match.teamA
                    },
                    {
                        name: teams.get(match.teamB),
                        winner: match.winner === match.teamB
                    }
                ]
            })
        })

        seenInRounds.forEach((seen, index) => {
            console.log(seen + " - " + index)
            const expected = expectedInRounds[index];
            if (seen >= expected) return;

            for (let i = 0; i < expected - seen; i++) {
                rounds[index].seeds.push({
                    id: index + "_" + i,
                    date: undefined,
                    maps: undefined,
                    teams: []
                })
            }
        })
        setBracketsMatches(rounds);
    }, [matches]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Grid container>
            {bracketsMatches && bracketsMatches.length > 0 &&
                <Grid item xs={12} sx={{pr: 2, backgroundColor: '#162329', borderRadius: 3, mr: 2, pt: 2}}>
                    <Bracket rounds={bracketsMatches} mobileBreakpoint={1}
                             roundTitleComponent={(title: ReactNode, roundIndex: number) => {
                                 return <Typography variant="h5" key={roundIndex}>{title}</Typography>
                             }}
                             renderSeedComponent={({seed, breakpoint, roundIndex, seedIndex}: IRenderSeedProps) => {
                                 return (
                                     <Seed mobileBreakpoint={breakpoint}>
                                         <SeedItem style={{backgroundColor: "#162329"}}>
                                             <Card sx={{
                                                 borderRadius: 4,
                                                 boxShadow: '5px 5px 15px 0px #000000',
                                                 '&.MuiCardContent-root': {p: 2}
                                             }}>
                                                 <CardContent sx={{
                                                     textAlign: "start",
                                                     "&:last-child": {
                                                         pb: 2
                                                     },
                                                     pl: 1, pr: 1
                                                 }}>
                                                     <Typography sx={{pl: 1}}>
                                                         <b>{!seed.date ? t('tournament.display.match.noDate') : t('date', {
                                                             date: Date.parse(seed.date),
                                                             formatParams: dateFormat
                                                         })}</b>
                                                     </Typography>
                                                     <SeedTeam
                                                         style={{color: seed.teams[0]?.winner ? '#03c8be' : 'inherit'}}><Typography
                                                         sx={{fontSize: "0.9rem"}}>{seed.teams[0]?.winner &&
                                                         <EmojiEventsIcon sx={{
                                                             verticalAlign: "middle",
                                                             mb: "3px",
                                                             mr: 1
                                                         }}/>}{seed.teams[0]?.name || '-'}</Typography></SeedTeam>
                                                     <SeedTeam
                                                         style={{color: seed.teams[1]?.winner ? '#03c8be' : 'inherit'}}><Typography
                                                         sx={{fontSize: "0.9rem"}}>{seed.teams[1]?.winner &&
                                                         <EmojiEventsIcon sx={{
                                                             verticalAlign: "middle",
                                                             mb: "3px",
                                                             mr: 1
                                                         }}/>}{seed.teams[1]?.name || '-'}</Typography></SeedTeam>
                                                     {seed.teams.length > 0 &&
                                                         <Button
                                                             sx={{width: "190px", margin: "auto", mt: 1, ml: "10px"}}
                                                             onClick={() => goToMatch(seed.id as string)}>
                                                             {t('tournament.display.match.more')}</Button>
                                                     }
                                                 </CardContent>
                                             </Card>
                                         </SeedItem>
                                     </Seed>
                                 )
                             }}
                    />
                </Grid>
            }
            {!bracketsMatches &&
                "Loading..."
            }
        </Grid>
    )
}