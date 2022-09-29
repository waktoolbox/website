import {Socket} from "socket.io";
import {DynamoDb} from "../../db/db-helper";
import {TournamentDefinition} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";

function getTournament(id: string, callback: (command: TournamentDefinition) => void, socket: Socket) {
    DynamoDb.get('tournaments', id)
        .then(result => callback(result.Item as TournamentDefinition))
        .catch(_ => socket.emit('error', 'tournament.not.found'));
}

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        getTournament(id, callback, socket);
    });
}

export function registerLoggedInTournamentEvents(socket: Socket) {
    socket.on('tournament::set', (id, data, callback) => {
        if (!id) {
            // TODO data validator
            const tournament = {
                ...data
            } as TournamentDefinition
            tournament.id = crypto.randomUUID();
            tournament.admins = [];
            tournament.admins.push(socket.data.user);
            DynamoDb.put("tournaments", tournament)
                .then(_ => callback(tournament))
                .catch(_ => socket.emit('error', 'tournament.cant.create'));
        }

        // TODO data validator
        DynamoDb.update("tournaments", id, data)
            .then(_ => callback(true))
            .catch(_ => socket.emit('error', 'tournament.cant.save'));
    });
}