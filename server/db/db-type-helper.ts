import {TournamentMatchModel, TournamentPhaseData, TournamentTeamModel} from "../../client/src/utils/tournament-models";

export type DbTournamentData = {
    tournamentId: string;
    phase: number;
    content: TournamentPhaseData<any>
}

export type DbTeamWithContent = {
    content: TournamentTeamModel
}

export type DbMatch = {
    id: string;
    tournamentId?: string;
    phase: number;
    content: TournamentMatchModel;
}