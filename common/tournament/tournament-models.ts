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
    streamers: TournamentStreamerModel[];
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
    round: number;
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
    tournament: string;
    name: string;
    server: string;
    leader: string;
    players: string[];
    validatedPlayers: string[];
    catchPhrase: string;
    stats?: TournamentStatsModel;
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
    date?: string;
    done: boolean;
    teamA: string;
    teamADraft?: TournamentDraftResultModel;
    teamB: string;
    teamBDraft?: TournamentDraftResultModel;
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
    WAKFU_WARRIORS_ROUND_ROBIN,
    WAKFU_WARRIORS_BRACKET_TOURNAMENT
}

export interface TournamentStreamerModel {
    id: string,
    link: string
}