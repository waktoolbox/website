import {TournamentPhaseData, TournamentTeamModel} from "../../client/src/utils/tournament-models";

export type DbTournamentData = {
    tournamentId: string;
    phase: number;
    content: TournamentPhaseData<any>
}

export type DbTeamWithContent = {
    content: TournamentTeamModel
}