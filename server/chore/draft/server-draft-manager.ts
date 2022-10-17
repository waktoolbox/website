import {ServerDraftController} from "./server-draft-controller";
import {DraftAction, DraftData, DraftTeam} from "../../../client/src/utils/draft-controller";
import * as crypto from "crypto";
import {Socket} from "socket.io";
import {SocketManager} from "../../api/socket-manager";
import {DbHelper} from "../../db/pg-helper";

class Manager {
    private currentDrafts: Map<string, ServerDraftController> = new Map();

    constructor() {
        setInterval(() => {
            this.currentDrafts.forEach(draft => {
                if (Math.abs(draft.startDate - Date.now()) > 60 * 60 * 1000) {
                    this.currentDrafts.delete(draft.data.id);
                }
            })
        }, 60000)
    }

    userRequestDraft(socket: Socket, draftId: string): Promise<DraftData | undefined> {
        // TODO v2 check DB for draft ID
        return new Promise((resolve) => {
            if (this.currentDrafts.has(draftId)) {
                const draft = this.currentDrafts.get(draftId);
                if (!draft) return resolve(undefined);

                socket.join(`draft-${draftId}`)
                const user = this.createUser(socket);
                draft.onUserJoin(user)
                socket.on('disconnect', () => {
                    SocketManager.io()?.to(`draft-${draftId}`).emit('draft::userDisconnected', user.id)
                })

                return resolve(draft.data);
            }

            DbHelper.rawQuery(`SELECT content
                               FROM drafts_data
                               WHERE id = $1`, [draftId]).then(r => {
                if (r.rowCount <= 0) return resolve(undefined);
                const draftData = r.rows[0].content;
                const draft = new ServerDraftController(draftData);
                this.processDraftJoin(socket, draftId, draft);

                return resolve(draft.data);
            })

            resolve(undefined);
        })
    }

    private processDraftJoin(socket: Socket, draftId: string, draft: ServerDraftController) {
        socket.join(`draft-${draftId}`)
        const user = this.createUser(socket);
        draft.onUserJoin(user)
        socket.on('disconnect', () => {
            SocketManager.io()?.to(`draft-${draftId}`).emit('draft::userDisconnected', user.id)
        })
    }

    private createUser(socket: Socket) {
        return (socket.data.user && socket.data.username && socket.data.discriminator)
            ? {
                id: socket.data.user,
                username: socket.data.username,
                discriminator: socket.data.discriminator,
                present: true
            }
            : {
                id: socket.id,
                username: socket.id,
                discriminator: "0000",
                present: true
            };
    }

    userCreateDraft(socket: Socket, draftData: DraftData): DraftData | undefined {
        if (!draftData || !draftData.configuration || !draftData.configuration.actions) return undefined;
        const user = this.createUser(socket);
        const controller = new ServerDraftController({
            id: crypto.randomUUID(),
            configuration: {
                leader: user.id,
                providedByServer: false,
                actions: draftData.configuration.actions
            },
            history: [],
            currentAction: 0,

            users: [user],

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
            SocketManager.io()?.to(`draft-${controller.data.id}`).emit('draft::creatorDisconnected')
            this.currentDrafts.delete(controller.data.id);
        })

        this.currentDrafts.set(controller.data.id, controller);
        return controller.data;
    }

    onAction(draftId: string, action: DraftAction, socket: Socket) {
        if (!this.currentDrafts.has(draftId)) return;

        const draft = this.currentDrafts.get(draftId);
        if (!draft) return;
        if (!draft.validator.validate(action, socket.data.user ? socket.data.user : socket.id)) return;

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
        if (draft.data.configuration.leader !== socket.id && draft.data.configuration.leader !== socket.data.user) return;
        draft.assignUser(userId, team);
    }

    onTeamReady(draftId: string, team: DraftTeam, ready: boolean, socket: Socket) {
        if (!this.currentDrafts.has(draftId)) return;

        const draft = this.currentDrafts.get(draftId);
        if (!draft) return;

        const associatedTeam = team === DraftTeam.TEAM_A ? draft.data.teamA : draft.data.teamB;
        if (!associatedTeam) return;
        if (!associatedTeam.find(u => u.id === socket.id || u.id === socket.data.user)) return;

        draft.onTeamReady(team, ready)
    }

}

export const DraftManager = new Manager();