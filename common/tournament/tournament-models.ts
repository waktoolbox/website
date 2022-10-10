export interface TournamentDefinition {
    id?: string;
    name: string;
    logo: string;
    server: string;
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
    streamers: string[];
}

export interface TournamentPhaseDefinition {
    phase: number;
    phaseType: TournamentPhaseType;
    roundModel: TournamentRoundDefinition[];

    poolSize?: number;
    poolNumber?: number;
}

export interface TournamentPhaseData<T extends TournamentPhaseTeamModel> {
    teams: T[];
    matches: string[];
    currentRound: number
}

export interface TournamentRoundDefinition {
    round: number;
    bo: number;
}

export interface TournamentPhaseController<T extends TournamentPhaseTeamModel, V extends TournamentPhaseData<T>> {
    definition: TournamentPhaseDefinition;
    data: V;

    initTeams: (teams: string[]) => void;
    initTeamsFromPreviousRound: <W extends TournamentPhaseTeamModel, Y extends TournamentPhaseData<W>> (previousPhaseData: Y, qualifiedTeams: string[]) => void;

    prepareRound(): Promise<boolean>;

    mustGoToNextPhase(): Promise<boolean>;

    mustGoToNextRound(): Promise<boolean>;

    getQualifiedTeams(): string[];
}

export interface TournamentPhaseTeamModel {
    id: string;
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

// TODO v2
export interface TournamentMatchModel {
    id?: string;
    date?: string;
    done: boolean;
    teamA: string;
    teamB: string;
    referee?: string;
    winner?: string;
    round?: number;
    tree?: number;
    rounds: TournamentMatchRoundModel[]
}

export interface TournamentMatchRoundModel {
    teamADraft?: TournamentDraftResultModel;
    teamBDraft?: TournamentDraftResultModel;
    map?: number;
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