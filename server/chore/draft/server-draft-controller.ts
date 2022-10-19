import {
    DraftAction,
    DraftActionType,
    DraftConfiguration,
    DraftController,
    DraftData,
    DraftNotifier,
    DraftTeam,
    DraftUser,
    DraftValidator
} from "../../../client/src/utils/draft-controller";
import {SocketManager} from "../../api/socket-manager";

export class ServerDraftController implements DraftController<DraftNotifier, ServerDraftValidator>, DraftNotifier {
    notifier: DraftNotifier;
    validator: ServerDraftValidator;
    data: DraftData;
    startDate = Date.now();

    private lockedForTeamA: number[] = [];
    private lockedForTeamB: number[] = [];
    private pickedByTeamA: number[] = [];
    private pickedByTeamB: number[] = [];

    constructor(data: DraftData) {
        this.notifier = this;
        this.validator = new ServerDraftValidator(this);
        this.data = data
    }

    init(configuration: DraftConfiguration): void {
        throw new Error("Can't init with a new configuration server side.");
    }

    onUserJoin(user: DraftUser): void {
        if (!this.data.users.find(u => u.id === user.id)) {
            this.data.users.push((user));
        }
        SocketManager.io()?.to(`draft-${this.data.id}`).emit('draft::userJoined', user);
        if (this.data.teamA?.find(u => u.id === user.id)) {
            return this.onUserAssigned(user, DraftTeam.TEAM_A)
        }
        if (this.data.teamB?.find(u => u.id === user.id)) {
            return this.onUserAssigned(user, DraftTeam.TEAM_B)
        }
    }

    assignUser(userId: string, team: DraftTeam) {
        const associatedTeam = team === DraftTeam.TEAM_A ? this.data.teamA : this.data.teamB;
        if (!associatedTeam) return;
        if (associatedTeam.length >= 6) return;
        const draftUser = this.data.users.find(u => u.id === userId);
        if (!draftUser) return;
        if (this.data?.teamA?.find(u => u.id === userId)) return;
        if (this.data?.teamB?.find(u => u.id === userId)) return;

        this.onUserAssigned(draftUser, team);
    }

    onUserAssigned(player: DraftUser, team: DraftTeam): void {
        const associatedTeam = team === DraftTeam.TEAM_A ? this.data.teamA : this.data.teamB;
        if (!this.data.configuration.providedByServer) {
            if (!associatedTeam?.find(u => u.id === player.id)) {
                associatedTeam?.push(player)
            }
        } else {
            const found = associatedTeam?.find(u => u.id === player.id);
            if (found) {
                found.username = player.username;
                found.discriminator = player.discriminator
                found.present = true
            }
        }
        SocketManager.io()?.to(`draft-${this.data.id}`).emit('draft::userAssigned', player, team);
    }

    onTeamReady(team: DraftTeam, ready: boolean) {
        if (team === DraftTeam.TEAM_A) this.data.teamAReady = ready;
        if (team === DraftTeam.TEAM_B) this.data.teamBReady = ready;

        SocketManager.io()?.to(`draft-${this.data.id}`).emit('draft::teamReady', team, ready);
    }

    areTeamReady(): boolean {
        return (this.data.teamAReady || false) && (this.data.teamBReady || false);
    }

    getCurrentAction(): DraftAction {
        return this.data.configuration.actions[this.data.currentAction];
    }

    onAction(playerAction: DraftAction): boolean {
        const currentAction = this.getCurrentAction();
        const action: DraftAction = {
            ...playerAction,
            lockForPickingTeam: currentAction.lockForPickingTeam,
            lockForOpponentTeam: currentAction.lockForOpponentTeam
        }

        if (action.type === DraftActionType.PICK) {
            if (action.team === DraftTeam.TEAM_A && this.lockedForTeamA.includes(action.breed as number)) return false;
            if (action.team === DraftTeam.TEAM_B && this.lockedForTeamB.includes(action.breed as number)) return false;
        }

        this.processAction(action);
        SocketManager.io()?.to(`draft-${this.data.id}`).emit('draft::action', action);
        return true;
    }

    restore(): void {
        this.data.history.forEach(action => {
            this.processAction(action);
        })
    }

    private processAction(action: DraftAction) {
        switch (action.type) {
            case DraftActionType.BAN:
                this.lockForAppropriateTeam(action);
                break;

            case DraftActionType.PICK:
                this.lockForAppropriateTeam(action);
                if (action.team === DraftTeam.TEAM_A) this.pickedByTeamA.push(action.breed as number);
                else if (action.team === DraftTeam.TEAM_B) this.pickedByTeamB.push(action.breed as number);
                break;

            default:
                console.error(`Unknown draft action: ${action.type}`)
                return;
        }
        this.data.history.push(action);
        this.data.currentAction++;
    }

    private lockForAppropriateTeam(action: DraftAction) {
        if (action.lockForOpponentTeam) {
            if (action.team === DraftTeam.TEAM_A) this.lockedForTeamB.push(action.breed as number)
            else if (action.team === DraftTeam.TEAM_B) this.lockedForTeamA.push(action.breed as number)
        }
        if (action.lockForPickingTeam) {
            if (action.team === DraftTeam.TEAM_A) this.lockedForTeamA.push(action.breed as number)
            else if (action.team === DraftTeam.TEAM_B) this.lockedForTeamB.push(action.breed as number)
        }
    }
}

export interface ServerDraftConfiguration extends DraftConfiguration {

}

export class ServerDraftValidator implements DraftValidator {
    private controller: ServerDraftController;

    constructor(controller: ServerDraftController) {
        this.controller = controller;
    }

    validate(action: DraftAction, user: string): boolean {
        if (!this.controller.areTeamReady()) return false;
        if (!action.breed) return false;

        const teamToCheck = action.team === DraftTeam.TEAM_A ? this.controller.data.teamA : this.controller.data.teamB;
        const teamUser = teamToCheck?.find(u => u.id === user);
        if (!teamUser) return false;

        const currentAction = this.controller.getCurrentAction();
        if (currentAction.type !== action.type) return false;
        return currentAction.team === action.team;

    }

}
