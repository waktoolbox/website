import {TournamentDefinition, TournamentMatchModel, TournamentPhaseType} from "../../../utils/tournament-models";
import {Trans, useTranslation} from "react-i18next";
import React, {SyntheticEvent, useEffect, useState} from "react";
import {Card, CardContent, Grid, styled, Tab, Tabs, Typography} from "@mui/material";
import TournamentTeamMatchView from "../tournament-team-match-view";
import TournamentTeamMatchViewShort from "../tournament-match-view-short";

type PropsTypes = {
    tournament: TournamentDefinition;
    teams: Map<string, any>;
    matches: TournamentMatchModel[];
    goToMatch: (matchId: string) => void;
}

type TeamQualification = {
    winQty: number;
    lossQty: number;
    presentInPhase3: boolean;
}

const matchByTab: Map<number, TournamentMatchModel[][]> = new Map();
const teamQualification: Map<string, TeamQualification> = new Map();

export default function WakfuWarriorsMatchResultListView({data}: { data: PropsTypes }) {
    const {
        tournament,
        teams,
        matches,
        goToMatch
    } = data;
    const {t} = useTranslation();

    const [tab, setTab] = useState(0);
    const [tabs, setTabs] = useState<string[]>([]);
    const [matchesToDisplay, setMatchesToDisplay] = useState<TournamentMatchModel[][]>();
    const [tournamentPhaseType, setTournamentPhaseType] = useState<TournamentPhaseType>();

    useEffect(() => {
        matchByTab.clear();
        teamQualification.clear();

        const tabs: string[] = [];
        tabs.push(t('tournament.display.match.allMatches'))

        const phaseType = tournament.phases[(matches[0]?.phase || 1) - 1].phaseType;
        switch (phaseType) {
            case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
                const maxPool = Math.max.apply(null, matches.map(m => m.pool));
                for (let i = 1; i <= maxPool + 1; i++) {
                    tabs.push(t('tournament.display.match.pool', {pool: i}))
                    const filteredMatches: TournamentMatchModel[][] = [];
                    filteredMatches[1] = [];
                    filteredMatches[2] = [];
                    filteredMatches[3] = [];

                    matches.filter(m => m.pool === i - 1).forEach(match => {
                        filteredMatches[match.round || 0].push(match);

                        const teamA = teamQualification.get(match.teamA || "") || {
                            winQty: 0,
                            lossQty: 0,
                            presentInPhase3: false
                        };
                        const teamB = teamQualification.get(match.teamB || "") || {
                            winQty: 0,
                            lossQty: 0,
                            presentInPhase3: false
                        };

                        if (match.winner === match.teamA) teamA.winQty++;
                        else teamA.lossQty++;

                        if (match.winner === match.teamB) teamB.winQty++;
                        else teamB.lossQty++;

                        if (match.round === 3) {
                            teamA.presentInPhase3 = true;
                            teamB.presentInPhase3 = true;
                        }

                        teamQualification.set(match.teamA, teamA);
                        teamQualification.set(match.teamB, teamB);
                    })
                    matchByTab.set(i, filteredMatches);
                }
                break;
        }
        setTournamentPhaseType(phaseType)
        setTabs(tabs);
    }, [matches]) // eslint-disable-line react-hooks/exhaustive-deps

    const computeTeamQualification = (round: number, team: string) => {
        if (!team || team.length <= 0) return undefined;
        if (round < 2) return undefined;
        const qualification = teamQualification.get(team);
        if (!qualification) return undefined;
        if (round === 2) {
            if (qualification.presentInPhase3) return undefined;
            if (qualification.winQty >= 2) return t('tournament.display.match.qualified');
            if (qualification.lossQty >= 2) return t('tournament.display.match.eliminated');
            return undefined;
        }

        return qualification.winQty >= 2 ? t('tournament.display.match.qualified') : t('tournament.display.match.eliminated');
    }

    const onTabChange = (event: SyntheticEvent, newTab: number) => {
        setMatchesToDisplay(matchByTab.get(newTab) || [])
        setTab(newTab);
    }

    return (
        <Grid container>
            <Grid item xs={12} sx={{pr: 2, backgroundColor: '#162329', borderRadius: 3, ml: 2, mr: 2}}>
                <Tabs value={tab} onChange={onTabChange}>
                    {tabs && tabs.map((tab, index) => (
                        <StyledTab key={index} label={tab}/>
                    ))}
                </Tabs>
                <Grid container>
                    <Grid item xs={12} sx={{ml: 2}}>
                        {tab === 0 && matches.map((m: TournamentMatchModel) => (
                            <TournamentTeamMatchView key={m.id || ""}
                                                     tournamentId={tournament.id || ""}
                                                     match={m}
                                                     displayedTeam={undefined}
                                                     displayedTeamName={teams.get(m.teamA)}
                                                     otherTeamName={teams.get(m.teamB)}
                                                     goToMatch={() => goToMatch(m.id || "")}
                                                     backgroundColor="#1f333a"
                            />
                        ))}

                        {tab > 0 && matchesToDisplay &&
                            <Grid container>
                                {tournamentPhaseType === TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN && matchesToDisplay.map((matchList, index) => (
                                    <Grid key={index} item xs={12} lg={4}>
                                        <Card sx={{
                                            mb: 2, mr: 2, mt: 2,
                                            borderRadius: 4,
                                            boxShadow: '5px 5px 15px 0px #000000',
                                            '&.MuiCardContent-root': {p: 2}
                                        }}>
                                            <CardContent sx={{
                                                "&:last-child": {
                                                    pb: 0
                                                }
                                            }}>
                                                <Typography variant="h5" sx={{textAlign: "start"}}>
                                                    <Trans i18nKey="tournament.display.match.resultPhaseTitle"
                                                           components={{span: <span className="firstWord"/>}}
                                                           values={{nb: index}}/>
                                                </Typography>

                                                {matchList && matchList.length > 0 && matchList.map(match => (
                                                    <TournamentTeamMatchViewShort key={match.id}
                                                                                  tournamentId={tournament.id || ""}
                                                                                  match={match}
                                                                                  teamAName={teams.get(match.teamA)}
                                                                                  teamAQualification={computeTeamQualification(match.round || 0, match.teamA)}
                                                                                  teamBName={teams.get(match.teamB)}
                                                                                  teamBQualification={computeTeamQualification(match.round || 0, match.teamB)}
                                                                                  goToMatch={() => goToMatch(match.id || "")}
                                                    />
                                                ))}
                                                {(!matchList || matchList.length <= 0) &&
                                                    <Typography sx={{ml: 2, mt: 2, pb: 2}}
                                                                variant="h5">{t('tournament.display.match.noMatchResult')}</Typography>
                                                }
                                            </CardContent>
                                        </Card>

                                    </Grid>
                                ))}
                            </Grid>
                        }
                    </Grid>
                </Grid>
            </Grid>
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