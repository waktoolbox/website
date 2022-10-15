import {ServerDraftController} from "./server-draft-controller";
import {DraftAction, DraftData, DraftTeam} from "../../../client/src/utils/draft-controller";
import * as crypto from "crypto";
import {Socket} from "socket.io";
import {SocketManager} from "../../api/socket-manager";

class Manager {
    private currentDrafts: Map<string, ServerDraftController> = new Map();

    userRequestDraft(socket: Socket, draftId: string): Promise<DraftData | undefined> {
        // TODO v2 check DB for draft ID
        return new Promise((resolve) => {
            if (this.currentDrafts.has(draftId)) {
                const draft = this.currentDrafts.get(draftId);
                if (!draft) return resolve(undefined);

                socket.join(`draft-${draftId}`)
                draft.onUserJoin(this.createUser(socket))

                return resolve(draft.data);
            }

            resolve(undefined);
        })
    }

    private createUser(socket: Socket) {
        return (socket.data.user && socket.data.username && socket.data.discriminator)
            ? {
                id: socket.data.user,
                username: socket.data.username,
                discriminator: socket.data.discriminator
            }
            : {
                id: socket.id,
                username: socket.id,
                discriminator: "0000"
            };
    }

    userCreateDraft(socket: Socket, draftData: DraftData): DraftData | undefined {
        if (!draftData || !draftData.configuration || !draftData.configuration.actions) return undefined;
        const controller = new ServerDraftController({
            id: crypto.randomUUID(),
            configuration: {
                leader: socket.id,
                providedByServer: false,
                actions: draftData.configuration.actions
            },
            history: [],
            currentAction: 0,

            users: [this.createUser(socket)],

            teamA: [],
            teamAInfo: {
                id: "1",
                name: "Team A"
            },
            teamB: [],
            teamBInfo: {
                id: "2",
                name: "Team B"
            }
        });

        socket.on('disconnect', () => {
            this.currentDrafts.delete(draftData.id);
            SocketManager.io()?.to(`draft-${draftData.id}`).emit('draft::creatorDisconnected')
        })

        // TODO draft cron delete
        this.currentDrafts.set(controller.data.id, controller);
        return controller.data;
    }

    onAction(draftId: string, action: DraftAction, socket: Socket) {
        if (!this.currentDrafts.has(draftId)) return;

        const draft = this.currentDrafts.get(draftId);
        if (!draft) return;
        if (!draft.validator.validate(action, socket.data.id ? socket.data.id : socket.id)) return;

        draft.onAction(action);

        if (draft.data.currentAction >= draft.data.configuration.actions.length) {
            this.currentDrafts.delete(draftId);
        }
    }

    assignUser(draftId: string, userId: string, team: DraftTeam, socket: Socket) {
        if (!this.currentDrafts.has(draftId)) return;

        const draft = this.currentDrafts.get(draftId);
        if (!draft) return;
        if (draft.data.configuration.providedByServer) return;
        if (draft.data.currentAction > 0) return;
        if (draft.data.configuration.leader !== socket.id) return;
        draft.assignUser(userId, team);
    }

    onTeamReady(draftId: string, team: DraftTeam, ready: boolean, socket: Socket) {
        if (!this.currentDrafts.has(draftId)) return;

        const draft = this.currentDrafts.get(draftId);
        if (!draft) return;

        const associatedTeam = team === DraftTeam.TEAM_A ? draft.data.teamA : draft.data.teamB;
        if (!associatedTeam) return;
        if (!associatedTeam.find(u => u.id === socket.id || u.id === socket.data.id)) return;

        draft.onTeamReady(team, ready)
    }

}

export const DraftManager = new Manager();