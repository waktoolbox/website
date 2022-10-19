import {Socket} from "socket.io";
import {DraftManager} from "./server-draft-manager";

export function registerDraftEvents(socket: Socket) {
    socket.on('draft::getById', (id, callback) => {
        DraftManager.userRequestDraft(socket, id)
            .then(r => callback(r))
            .catch(_ => callback(undefined))
    });

    socket.on('draft::create', (data, callback) => {
        callback(DraftManager.userCreateDraft(socket, data))
    })

    socket.on('draft::action', async (draftId, action) => {
        await DraftManager.onAction(draftId, action, socket)
    })

    socket.on('draft::assignUser', (draftId, userId, team) => {
        DraftManager.assignUser(draftId, userId, team, socket)
    })

    socket.on('draft::teamReady', (draftId, team, ready) => {
        DraftManager.onTeamReady(draftId, team, ready, socket);
    })

    socket.on('draft::leave', id => {
        // TODO draft
    })
}