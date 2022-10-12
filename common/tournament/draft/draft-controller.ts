export interface DraftController<C extends DraftConfiguration, N extends DraftNotifier, V extends DraftValidator> {
    new(notifier: N, validator: V): DraftController<C, N, V>;

    notifier: DraftNotifier;
    validator: DraftValidator;

    init(configuration: DraftConfiguration): void;

    restore(data: DraftData): void;

    onAction(action: DraftAction): boolean;
}

export interface DraftConfiguration {
    leader?: string;
    providedByServer: boolean;
    actions: DraftActionType[];
}

export interface DraftData {
    id?: string;
    configuration: DraftConfiguration;
    teamA: DraftUser[];
    teamAInfo?: DraftTeamInfo;
    teamB: DraftUser[];
    teamBInfo?: DraftTeamInfo;
    history: DraftAction[];
    currentAction: number;
}

export enum DraftTeam {
    TEAM_A,
    TEAM_B
}

export enum DraftActionType {
    READY,
    COMMON_BAN,
    COMMON_PICK,
    BAN,
    PICK
}

export enum DraftBreed {
    FECA = 1,
    OSAMODAS,
    ENUTROF,
    SRAM,
    XELOR,
    ECAFLIP,
    ENIRIPSA,
    IOP,
    CRA,
    SADIDA,
    SACRIER,
    PANDAWA,
    ROUBLARD,
    ZOBAL,
    OUGINAK,
    STEAMER,
    ELIOTROPE = 18,
    HUPPERMAGE
}

export interface DraftAction {
    type: DraftActionType;
    team?: DraftTeam;
    breed?: DraftBreed;
}

export interface DraftUser {
    id: string;
    username: string;
    discriminator: string;
    captain?: boolean;
}

export interface DraftTeamInfo {
    id: string;
    name: string;
}

export interface DraftNotifier {
    onUserJoin(user: DraftUser): void;

    onUserAssigned(player: string, team: DraftTeam): void;
}

export interface DraftValidator {
    validate(action: DraftAction, user: string): boolean;
}