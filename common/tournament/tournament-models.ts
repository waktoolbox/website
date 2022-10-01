export interface TournamentDefinition {
    id?: string;
    name: string;
    startDate: string;
    endDate: string;
    level: number;
    description: string;
    rewards: string;
    rules: string;

    teamNumber: number;
    teamSize: string;
    maps: number[];
    phases: TournamentPhaseDefinition[]

    admins: string[];
    referees: string[];
    streamers: Todo[];
}

export interface TournamentPhaseDefinition {
    phaseType: TournamentPhaseType;
    roundModel: TournamentRoundDefinition[];

    poolSize?: number;
    poolNumber?: number;
}

export interface TournamentPhaseData<T extends TournamentTeamModel, M extends TournamentMatchModel> {
    id?: string;
    teams: T[];
    matches: M[];
    currentRound: number
}

export interface TournamentRoundDefinition {
    bo: number;
}

export interface TournamentPhaseController<T extends TournamentTeamModel, M extends TournamentMatchModel, V extends TournamentPhaseData<T, M>> {
    definition: TournamentPhaseDefinition;
    data: V;

    prepareRound: () => void;
    mustGoToNextPhase: () => boolean;
    getQualifiedTeams: () => TournamentTeamModel[];
}

export interface TournamentTeamModel {
    id?: string;
    name: string;
    server: "Pandora" | "Rubilax";
    leader: string;
    players: string[];
    catchPhrase: string;
    stats: TournamentStatsModel;
}

export interface TournamentStatsModel {
    played: number;
    victories: number;
    turnByMatch: number;
    statsByClass: TournamentStatsClassModel[];
}

export interface TournamentStatsClassModel {
    id: number;
    played: number;
    banned: number;
    victories: number;
    killed: number;
    death: number;
}

export interface TournamentMatchModel {
    id?: string;
    date: string;
    done: boolean;
    teamA: string;
    teamADraft: TournamentDraftResultModel;
    teamB: string;
    teamBDraft: TournamentDraftResultModel;
    map?: number;
    referee?: string;
    winner?: string;
    round?: number;
}

export interface TournamentDraftResultModel {
    pickedClasses: number[];
    bannedClasses: number[];
}

export enum TournamentPhaseType {
    NONE,
    WAKFU_WARRIORS_ROUND_ROBIN
}

interface Todo {
}