import {TournamentDefinition, TournamentMatchModel, TournamentPhaseType} from "../../utils/tournament-models";
import {useTranslation} from "react-i18next";
import React, {SyntheticEvent, useEffect, useState} from "react";
import {Grid, styled, Tab, Tabs} from "@mui/material";
import TournamentTeamMatchView from "./tournament-team-match-view";

type PropsTypes = {
    tournament: TournamentDefinition;
    teams: Map<string, any>;
    matches: TournamentMatchModel[];
    goToMatch: (matchId: string) => void;
}

const matchByTab: Map<number, TournamentMatchModel[]> = new Map();

export default function TournamentMatchListView({data}: { data: PropsTypes }) {
    const {
        tournament,
        teams,
        matches,
        goToMatch
    } = data;
    const {t} = useTranslation();

    const [tab, setTab] = useState(0);
    const [tabs, setTabs] = useState<string[]>([]);
    const [matchesToDisplay, setMatchesToDisplay] = useState<TournamentMatchModel[]>(matches);

    useEffect(() => {
        const tabs: string[] = [];
        tabs.push(t('tournament.display.match.allMatches'))
        matchByTab.set(0, [...matches])

        switch (tournament.phases[(matches[0]?.phase || 1) - 1].phaseType) {
            case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
                const maxPool = Math.max.apply(null, matches.map(m => m.pool));
                for (let i = 1; i <= maxPool + 1; i++) {
                    tabs.push(t('tournament.display.match.pool', {pool: i}))
                    matchByTab.set(i, matches.filter(m => m.pool === i - 1))
                }
                break;
        }

        setTabs(tabs);
    }, [matches])

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
                    <Grid item xs={12} sx={{ml: 4}}>
                        {matchesToDisplay && matchesToDisplay.map(m => (
                            <TournamentTeamMatchView key={m.id || ""}
                                                     match={m}
                                                     displayedTeam={undefined}
                                                     displayedTeamName={teams.get(m.teamA)}
                                                     otherTeamName={teams.get(m.teamB)}
                                                     goToMatch={() => goToMatch(m.id || "")}
                                                     backgroundColor="#1f333a"
                            />
                        ))}
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