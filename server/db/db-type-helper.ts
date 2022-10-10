import {TournamentPhaseData, TournamentTeamModel} from "../../common/tournament/tournament-models";

export type DbTournamentData = {
    tournamentId: string;
    phase: number;
    content: TournamentPhaseData<any>
}

export type DbTeamWithContent = {
    content: TournamentTeamModel
}