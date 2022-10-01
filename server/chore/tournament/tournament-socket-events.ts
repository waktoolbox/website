import {Socket} from "socket.io";
import {TournamentDefinition} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";
import {validateTournamentDefinition} from "../../../client/src/utils/tournament-validator";
import {DbHelper} from "../../db/pg-helper";
import {TournamentHomeProvider} from "./tournament-home-provider"; // TODO sorry, lack of time

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        DbHelper.getTournament(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.not.found'));
    });

    socket.on('tournament::home', (callback) => {
        TournamentHomeProvider.getHome().then(home => callback(home)).catch(error => console.error(error));
    })
}

export function registerLoggedInTournamentEvents(socket: Socket) {
    socket.on('tournament::setBaseInformation', (id, data, callback) => {
        const validationResult = validateTournamentDefinition(data as TournamentDefinition, Date.now());
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save');

        if (data.id && data.id !== id) {
            console.warn(`User ${socket.data.user} tried to inject some crap on tournament ${id} with data id ${data.id}`)
            return;
        }

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


        DbHelper.isTournamentAdmin(id, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return socket.emit('error', 'tournament.cant.save');
                DbHelper.saveTournament(data)
                    .then(_ => {
                        callback(true);
                        socket.emit('success', 'tournament.saved')
                    })
                    .catch(_ => socket.emit('error', 'tournament.cant.save'));
            })
            .catch(error => {
                socket.emit('error', 'tournament.cant.save')
            });

    });
}