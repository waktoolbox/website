import {TournamentPhaseData, TournamentPhaseMatchModel, TournamentPhaseTeamModel,} from "../tournament-models";


export interface WakfuWarriorsPhaseOneData extends TournamentPhaseData<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel> {
    teamPool: WakfuWarriorsTeamPool[]
}

export interface WakfuWarriorsPhaseTwoData extends TournamentPhaseData<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel> {
}

export interface WakfuWarriorsTeamModel extends TournamentPhaseTeamModel {
    winInPhaseOne: number;
}

export interface WakfuWarriorsMatchModel extends TournamentPhaseMatchModel {
    round: number;
}

export interface WakfuWarriorsTeamPool {
    teams: string[];
    matches: string[];
}