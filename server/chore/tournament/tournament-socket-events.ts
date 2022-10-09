import {Socket} from "socket.io";
import {TournamentDefinition, TournamentTeamModel} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";
// TODO sorry, lack of time
import {validateTournamentDefinition, validateTournamentTeam} from "../../../client/src/utils/tournament-validator";
import {DbHelper} from "../../db/pg-helper";
import {TournamentHomeProvider} from "./tournament-home-provider";
import {DiscordBot} from "../../discord/bot";

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        if (!callback) return;
        DbHelper.getTournament(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.not.found'));
    });
    socket.on('tournament::getTeam', (id, callback) => {
        if (!callback) return;
        DbHelper.getTeam(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.team.not.found'));
    });
    socket.on('tournament::getTournamentTeamsWithLimit', (id, callback) => {
        if (!callback) return;
        DbHelper.getTournamentTeamsWithLimit(id)
            .then(result => callback(result))
            .catch(_ => socket?.emit('error', 'tournament.not.found'));
    });
    socket.on('tournament::isTournamentStarted', (id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentStarted(id).then(result => callback(result)).catch(_ => callback(true));
    })

    socket.on('tournament::home', (callback) => {
        if (!callback) return;
        TournamentHomeProvider.getHome().then(home => callback(home)).catch(error => console.error(error));
    })
}

export function registerLoggedInTournamentEvents(socket: Socket) {
    socket.on('tournament::setBaseInformation', (id, data, callback) => {
        if (!callback) return;
        const validationResult = validateTournamentDefinition(data as TournamentDefinition, Date.now());
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save.tournament');

        if (data.id && data.id !== id) {
            console.warn(`User ${socket.data.user} tried to inject some crap on tournament ${id} with data id ${data.id}`)
            return;
        }

        if (!id) {
            // TODO when creation opens to public : remove this
            return socket.emit('info', 'tournament.creationComingLater')

            const tournament = {
                ...data
            } as TournamentDefinition
            tournament.id = crypto.randomUUID();
            tournament.admins = [];
            tournament.admins.push(socket.data.user);
            tournament.referees = [socket.data.user];
            tournament.streamers = [];
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
        if (!callback) return;
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

        const isTournamentStartedPromise = DbHelper.isTournamentStarted(team.tournament);
        const noDuplicateInTeam = DbHelper.checkTeamPlayersValidityForRegistration(team.tournament, team.players, team.id as string);

        Promise.all([noDuplicateInTeam, isTournamentStartedPromise])
            .then(promises => {
                if (!promises[0]) {
                    return socket.emit('error', 'tournament.cant.save.teamPlayerAlreadyRegistered');
                }
                const isTournamentStarted = promises[1];

                if (isTournamentStarted && !id) return socket.emit('error', 'tournament.cant.save.tournamentAlreadyStarted');

                (!id ? Promise.resolve(undefined) : DbHelper.getTeam(id))
                    .then(result => {
                        if (id) {
                            if (!result) return reject();
                            if (socket.data.user !== result.leader) return reject();

                            if (isTournamentStarted) {
                                team.name = result.name;
                                team.validatedPlayers = result.validatedPlayers;
                                team.players = result.validatedPlayers;
                                team.stats = result.stats
                            }

                            team.validatedPlayers = team.validatedPlayers.filter(p => team.players.includes(p));
                        }

                        DbHelper.saveTeam(team)
                            .then(saveResult => {
                                callback(saveResult);
                                socket.emit('success', 'tournament.saved.team');

                                team.players.filter(p => p !== team.leader && (result ? !result.players.includes(p) : true)).forEach(player => DiscordBot.sendPrivateMessage(player, `You've been requested to join the team "${team.name}". You can validate it here: ${process.env.LOGON_REDIRECTION}/tournament/${team.tournament}/register/${team.id}/validate`))
                            })
                            .catch(_ => socket.emit('error', 'tournament.cant.save.team'));
                    })
                    .catch(error => {
                        console.error(error);
                        reject();
                    })
            })
            .catch(error => {
                console.error(error);
                reject()
            });
    });

    socket.on('tournament::getMyTeam', (tournamentId, callback) => {
        if (!callback) return;
        DbHelper.getValidatedTeamForPlayer(tournamentId, socket.data.user)
            .then(result => callback(result))
            .catch(error => callback(undefined));
    })

    socket.on('tournament::deleteMyTeam', (tournamentId, teamId, callback) => {
        if (!callback) return;
        DbHelper.isTeamLeader(teamId, tournamentId, socket.data.user)
            .then(_ => {
                DbHelper.deleteTeam(teamId)
                    .then(_ => callback(true))
                    .catch(_ => callback(false))

            })
            .catch(_ => callback(false))
    })

    socket.on('tournament::admin:getAllTeams', (id, callback) => {
        if (!callback) return;
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
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.deleteTeamFromTournament(id, tournamentId)
                    .then(result => callback(result))
                    .catch((_) => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::validatePlayer', (teamId, callback) => {
        if (!callback) return;
        DbHelper.rawQuery(`UPDATE teams
                           SET content = jsonb_set(content, '{validatedPlayers}', content -> ('validatedPlayers') || $1)
                           WHERE id = $2
                             AND content -> ('players') ? $3
                             AND NOT content -> ('validatedPlayers') ? $3`
            , [JSON.stringify(socket.data.user), teamId, socket.data.user])
            .then(result => callback(result.rowCount > 0))
            .catch(error => callback(false))
    })

    socket.on('tournament::invalidatePlayer', (teamId, callback) => {
        if (!callback) return;
        DbHelper.rawQuery(`UPDATE teams
                           SET content = jsonb_set(content, '{validatedPlayers}',
                                                   (content -> ('validatedPlayers')) - $1)
                           WHERE id = $2
                             AND content -> ('validatedPlayers') ? $1
                             AND NOT content ->> ('leader') = $1`
            , [socket.data.user, teamId])
            .then(result => callback(result.rowCount > 0))
            .catch(error => callback(false))
    })

    socket.on('tournament::admin:addAdmin', (tournamentId, id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{admins}', content -> ('admins') || $1)
                                   WHERE id = $3
                                     AND NOT content -> ('admins') ? $2`
                    , [JSON.stringify(id), id, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::admin:removeAdmin', (tournamentId, id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{admins}',
                                                           (content -> ('admins')) - $1)
                                   WHERE id = $2
                                     AND content -> ('admins') ? $1`
                    , [id, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::admin:addReferee', (tournamentId, id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{referees}', content -> ('referees') || $1)
                                   WHERE id = $3
                                     AND NOT content -> ('referees') ? $2`
                    , [JSON.stringify(id), id, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::admin:removeReferee', (tournamentId, id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{referees}',
                                                           (content -> ('referees')) - $1)
                                   WHERE id = $2
                                     AND content -> ('referees') ? $1`
                    , [id, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::admin:addStreamer', (tournamentId, streamer, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{streamers}', content -> ('streamers') || $1)
                                   WHERE id = $3
                                     AND NOT content -> ('streamers') ? $2`
                    , [JSON.stringify(streamer), streamer, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })

    socket.on('tournament::admin:removeStreamer', (tournamentId, id, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                DbHelper.rawQuery(`UPDATE tournaments
                                   SET content = jsonb_set(content, '{streamers}',
                                                           (content -> ('streamers')) - $1)
                                   WHERE id = $2
                                     AND content -> ('streamers') ? $1`
                    , [id, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(error => callback(false))
            })
            .catch((_) => callback(false))
    })
}