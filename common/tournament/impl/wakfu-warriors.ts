import {TournamentMatchModel, TournamentPhaseData, TournamentTeamModel} from "../tournament-models";


export interface WakfuWarriorsPhaseOneData extends TournamentPhaseData<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel> {
    teamPool: WakfuWarriorsTeamPool[]
}

export interface WakfuWarriorsPhaseTwoData extends TournamentPhaseData<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel> {
}

export interface WakfuWarriorsTeamModel extends TournamentTeamModel {
    winInPhaseOne: number;
}

export interface WakfuWarriorsMatchModel extends TournamentMatchModel {

}

export interface WakfuWarriorsTeamPool {
    teams: string[];
    matches: string[];
}