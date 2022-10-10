import {TournamentMatchModel, TournamentPhaseData, TournamentPhaseTeamModel,} from "../tournament-models";


export interface WakfuWarriorsPhaseOneData extends TournamentPhaseData<WakfuWarriorsTeamModel> {
    teamPool: WakfuWarriorsTeamPool[]
}

export interface WakfuWarriorsPhaseTwoData extends TournamentPhaseData<WakfuWarriorsTeamModel> {
}

export interface WakfuWarriorsTeamModel extends TournamentPhaseTeamModel {
    winInPhaseOne: number;
    lossInPhaseOne: number;
}

export interface WakfuWarriorsMatchModel extends TournamentMatchModel {
    round: number;
    pool: number;
}

export interface WakfuWarriorsTeamPool {
    teams: string[];
    matches: string[];
}