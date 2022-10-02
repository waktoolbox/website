import {Socket} from "socket.io";
import {TournamentDefinition, TournamentTeamModel} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";
import {validateTournamentDefinition, validateTournamentTeam} from "../../../client/src/utils/tournament-validator";
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
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save.tournament');

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
                    socket.emit('success', 'tournament.saved.tournament')
                })
                .catch(_ => socket.emit('error', 'tournament.cant.create'));
        }


        DbHelper.isTournamentAdmin(id, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return socket.emit('error', 'tournament.cant.save.tournament');
                DbHelper.saveTournament(data)
                    .then(_ => {
                        callback(true);
                        socket.emit('success', 'tournament.saved.tournament')
                    })
                    .catch(_ => socket.emit('error', 'tournament.cant.save.tournament'));
            })
            .catch(error => {
                socket.emit('error', 'tournament.cant.save.tournament')
            });
    });

    socket.on('tournament::registerTeam', (id, data, callback) => {
        const validationResult = validateTournamentTeam(data as TournamentTeamModel);
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save.team');

        if (data.id && data.id !== id) {
            console.warn(`User ${socket.data.user} tried to inject some crap on team ${id} with data id ${data.id}`)
            return;
        }
        if (!data.tournament) return;

        const team = {
            ...data
        } as TournamentTeamModel

        if (!id) {
            team.id = crypto.randomUUID()
            team.validatedPlayers = [team.leader]
        }
        if (!team.leader) team.leader = socket.data.user;

        team.stats = undefined;

        const isTeamLeaderPromise = !id ? Promise.resolve(true) : DbHelper.isTeamLeader(id, team.tournament, socket.data.user);
        const noDuplicateInTeam = DbHelper.checkTeamPlayersValidityForRegistration(team.tournament, team.players);
        // TODO check this for edit
        const noChangeInValidated = !id ? Promise.resolve(true) : DbHelper.checkTeamChangeInValidatedForRegistration(id, team.validatedPlayers);

        Promise.all([isTeamLeaderPromise, noDuplicateInTeam, noChangeInValidated])
            .then(promises => {
                if (promises.filter(r => r).length != promises.length) {
                    if (!promises[1]) {
                        return socket.emit('error', 'tournament.cant.save.teamPlayerAlreadyRegistered');
                    }
                    return socket.emit('error', 'tournament.cant.save.team');
                }


                DbHelper.saveTeam(team)
                    .then(result => {
                        callback(result);
                        socket.emit('success', 'tournament.saved.team')
                    })
                    .catch(_ => socket.emit('error', 'tournament.cant.save.team'));
            })
            .catch(error => {
                console.error(error);
                socket.emit('error', 'tournament.cant.save.team')
            });

    });
}