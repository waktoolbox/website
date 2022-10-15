import {Breeds} from "./breeds";

// TODO later : find a way to let this in common
export interface DraftController<C extends DraftConfiguration, N extends DraftNotifier, V extends DraftValidator> {
    notifier: N;
    validator: V;

    init(configuration: DraftConfiguration): void;

    restore(): void;

    onAction(action: DraftAction): boolean;

    onTeamReady(team: DraftTeam, ready: boolean): void;
}

export interface DraftConfiguration {
    leader?: string;
    providedByServer?: boolean;
    actions: DraftAction[];
}

export interface DraftData {
    id: string;
    configuration: DraftConfiguration;
    history: DraftAction[];
    currentAction: number;

    users: DraftUser[];

    teamA?: DraftUser[];
    teamAInfo?: DraftTeamInfo;
    teamAReady?: boolean;
    teamB?: DraftUser[];
    teamBInfo?: DraftTeamInfo;
    teamBReady?: boolean;
}

export enum DraftTeam {
    TEAM_A = 1,
    TEAM_B
}

export enum DraftActionType {
    BAN = 1,
    PICK
}

export interface DraftAction {
    type: DraftActionType;
    team?: DraftTeam;
    breed?: Breeds;
    lockForPickingTeam?: boolean;
    lockForOpponentTeam?: boolean
}

export interface DraftUser {
    id: string;
    username: string;
    discriminator: string;
    captain?: boolean;
    present?: boolean;
}

export interface DraftTeamInfo {
    id: string;
    name: string;
}

export interface DraftNotifier {
    onUserJoin(user: DraftUser): void;

    onUserAssigned(player: DraftUser, team: DraftTeam): void;

    onAction(action: DraftAction): void;
}

export interface DraftValidator {
    validate(action: DraftAction, user: string): boolean;
}