export interface TournamentDefinition {
    id?: string;
    name: string;
    startDate: number;
    endDate: number;
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
    matches: string[];
}

export interface TournamentMatchModel {
    id?: string;
    done: boolean;
    teamA: string;
    teamB: string;
    winner?: string;
    round?: number;
}

export enum TournamentPhaseType {
    NONE,
    WAKFU_WARRIORS_ROUND_ROBIN
}

interface Todo {
}