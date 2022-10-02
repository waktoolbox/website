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
    socket.on('tournament::getTeam', (id, callback) => {
        DbHelper.getTeam(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.team.not.found'));
    });
    socket.on('tournament::getWithTeams', (id, callback) => {
        DbHelper.getTournamentAndTeams(id)
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
        function reject() {
            return socket.emit('error', 'tournament.cant.save.team');
        }

        const validationResult = validateTournamentTeam(data as TournamentTeamModel);
        if (validationResult != undefined) return reject();

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
            team.leader = socket.data.user
            team.validatedPlayers = [team.leader]
        } else {
            if (team.leader !== socket.data.user) return reject();
            if (!team.players || !team.players.includes(team.leader)) return reject();
        }

        // TODO v1 manage this properly for edition
        team.stats = undefined;

        const isTeamLeaderPromise = !id ? Promise.resolve(true) : DbHelper.isTeamLeader(id, team.tournament, socket.data.user);
        const noDuplicateInTeam = DbHelper.checkTeamPlayersValidityForRegistration(team.tournament, team.players, team.id as string);
        const noChangeInValidated = !id ? Promise.resolve(true) : DbHelper.checkTeamChangeInValidatedForRegistration(id, team.validatedPlayers);

        Promise.all([isTeamLeaderPromise, noDuplicateInTeam, noChangeInValidated])
            .then(promises => {
                if (promises.filter(r => r).length != promises.length) {
                    if (!promises[1]) {
                        return socket.emit('error', 'tournament.cant.save.teamPlayerAlreadyRegistered');
                    }
                    return reject();
                }

                if (id) {
                    team.validatedPlayers = team.validatedPlayers.filter(p => team.players.includes(p));
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
                reject();
            });

    });

    socket.on('tournament::getMyTeam', (tournamentId, callback) => {
        DbHelper.getValidatedTeamForPlayer(tournamentId, socket.data.user)
            .then(result => callback(result))
            .catch(error => callback(undefined));
    })

    socket.on('tournament::deleteMyTeam', (tournamentId, teamId, callback) => {
        DbHelper.isTeamLeader(teamId, tournamentId, socket.data.user)
            .then(_ => {
                DbHelper.deleteTeam(teamId)
                    .then(_ => callback(true))
                    .catch(_ => callback(false))

            })
            .catch(_ => callback(false))
    })

    socket.on('tournament::admin:getAllTeams', (id, callback) => {
        DbHelper.isTournamentAdmin(id, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback([])
                DbHelper.getTournamentTeams(id)
                    .then(result => callback(result))
                    .catch((_) => callback([]))
            })
            .catch((_) => callback([]))
    })

    socket.on('tournament::admin::deleteTeam', (tournamentId, id, callback) => {
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.deleteTeamFromTournament(id, tournamentId)
                    .then(result => callback(result))
                    .catch((_) => callback(false))
            })
            .catch((_) => callback(false))
    })
}