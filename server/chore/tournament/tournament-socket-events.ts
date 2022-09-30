import {Socket} from "socket.io";
import {TournamentDefinition} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";
import {validateTournamentDefinition} from "../../../client/src/utils/tournament-validator";
import {DbHelper} from "../../db/pg-helper"; // TODO sorry, lack of time

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        DbHelper.getTournament(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.not.found'));
    });
}

export function registerLoggedInTournamentEvents(socket: Socket) {
    socket.on('tournament::setBaseInformation', (id, data, callback) => {
        const validationResult = validateTournamentDefinition(data as TournamentDefinition, Date.now());
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save');

        if (!id) {
            const tournament = {
                ...data
            } as TournamentDefinition
            tournament.id = crypto.randomUUID();
            tournament.admins = [];
            tournament.admins.push(socket.data.user);
            DbHelper.saveTournament(tournament)
                .then(_ => {
                    callback(tournament);
                    socket.emit('success', 'tournament.saved')
                })
                .catch(_ => socket.emit('error', 'tournament.cant.create'));
        }


        DbHelper.getTournament(id) // TODO use a specific request to check only admins matching
            .then(tournament => {
                if (!tournament || !tournament.admins || !tournament.admins.includes(socket.data.user)) return socket.emit('error', 'tournament.cant.save');

                DbHelper.saveTournament(tournament)
                    .then(_ => {
                        callback(true);
                        socket.emit('success', 'tournament.saved')
                    })
                    .catch(_ => socket.emit('error', 'tournament.cant.save'));
            }).catch(error => {
            socket.emit('error', 'tournament.cant.save')
        });

    });
}