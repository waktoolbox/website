import {
    TournamentMatchModel,
    TournamentPhaseData,
    TournamentPhaseTeamModel,
} from "../../../client/src/utils/tournament-models";


export interface WakfuWarriorsPhaseOneData extends TournamentPhaseData<WakfuWarriorsTeamModel> {
    teamPool: WakfuWarriorsTeamPool[]
}

export interface WakfuWarriorsPhaseTwoData extends TournamentPhaseData<WakfuWarriorsTeamModel> {
    basePlacement: string[];
}

export interface WakfuWarriorsTeamModel extends TournamentPhaseTeamModel {
    poolOnPhaseOne?: number;
    qualifyingStepOnPhaseOne?: number;
    initialPlacement?: number;
}

export interface WakfuWarriorsMatchModel extends TournamentMatchModel {
    pool: number;
}

export interface WakfuWarriorsTeamPool {
    teams: string[];
    matches: string[];
}