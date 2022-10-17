import {Socket} from "socket.io";
import {
    TournamentDefinition,
    TournamentMatchModel,
    TournamentTeamModel
} from "../../../client/src/utils/tournament-models";
import * as crypto from "crypto";
// TODO sorry, lack of time
import {validateTournamentDefinition, validateTournamentTeam} from "../../../client/src/utils/tournament-validator";
import {DbHelper} from "../../db/pg-helper";
import {TournamentHomeProvider} from "./tournament-home-provider";
import {DiscordBot} from "../../discord/bot";
import {getMatch, getMatchesResult, getNextMatches, goToNextPhaseOrRound} from "./tournament-controller";
import {DraftData} from "../../../client/src/utils/draft-controller";
import {DraftTemplates} from "../../../client/src/utils/draft-templates";

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

    socket.on('tournament::getAllTeamMatches', (teamId, callback) => {
        if (!callback) return;
        DbHelper.rawQuery(`SELECT content
                           FROM matches
                           WHERE content ->> ('teamA') = $1
                              OR content ->> ('teamB') = $1`, [teamId])
            .then(result => callback(result.rowCount <= 0 ? [] : result.rows.map(r => r.content)))
            .catch(_ => callback([]))
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

    socket.on('tournament::getTeamsNames', (teamIds, callback) => {
        if (!callback) return;
        DbHelper.getTeamsNames(teamIds).then(r => callback(r))
    })

    socket.on('tournament::getNextMatches', (tournamentId, phase, callback) => {
        if (!callback) return;
        getNextMatches(tournamentId, parseInt(phase)).then(r => callback(r))
    })

    socket.on('tournament::getMatchesResult', (tournamentId, phase, callback) => {
        if (!callback) return;
        getMatchesResult(tournamentId, parseInt(phase)).then(r => callback(r))
    })

    socket.on('tournament::getMatch', (id, callback) => {
        if (!callback) return;
        getMatch(id).then(r => callback(r));
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

    socket.on('tournament::admin:goToNextPhase', (tournamentId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return callback(false)
                goToNextPhaseOrRound(tournamentId).then(result => {
                    callback(result);
                    if (result) return socket.emit('success', 'tournament.admin.nextPhaseStarted');
                    socket.emit('error', 'tournament.admin.cantGoToNextPhase');
                }).catch(error => {
                    console.error(error);
                    callback(false);
                    socket.emit('error', 'tournament.admin.cantGoToNextPhase');
                })
            })
            .catch((_) => callback(false))
    });

    socket.on('tournament::admin:reminderAnkamaInfo', (tournamentId) => {
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isAdmin => {
                if (!isAdmin) return;
                DbHelper.rawQuery(`SELECT accounts.id
                                   FROM teams
                                            CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS(teams.content -> ('players')) AS e(usr)
                                            LEFT JOIN accounts
                                                      ON substr(usr::text, 2, length(usr::text) - 2) = accounts.id
                                   WHERE accounts."ankamaName" is null
                                      OR accounts."ankamaDiscriminator" is null
                                   GROUP BY accounts.id;`, [])
                    .then(result => {
                        if (result.rowCount <= 0) return;

                        result.rows.map(r => r.id).forEach(id => {
                            DiscordBot.sendPrivateMessage(id,
                                `:warning: __**IMPORTANT REMINDER**__ :warning:  — If your Ankama nickname is not correctly registered through Waktool, you will not have access to the beta server on Monday. This is your only chance to be whitelisted!

__**How to register my Ankama nickname?**__
-> Sign in to WAKTOOL (https://www.waktool.com)
-> Open the menu
-> "My account"
-> Entry your Ankama Nickname
-> Entry your Ankama # discriminator (without #)

Ankama will not provide additional access!`)
                        })
                    })
                    .catch(_ => {
                    })
            })
            .catch((_) => {
            })
    })

    socket.on('tournament::admin:removeMatchStreamer', (tournamentId, matchId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentAdmin(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{streamer}', 'null')
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::streamer:setMatchStreamer', (tournamentId, matchId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentStreamer(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{streamer}', $3)
                                   WHERE id = $1
                                     AND "tournamentId" = $2
                                     AND (content ->> ('streamer')) is null`, [matchId, tournamentId, JSON.stringify(socket.data.user)])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:setDraftDate', (tournamentId, matchId, round, date, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);
                DbHelper.rawQuery(`SELECT content
                                   FROM matches
                                   WHERE id = $1
                                     AND "tournamentId" = $2
                                   LIMIT 1`, [matchId, tournamentId])
                    .then(result => {
                        if (result.rowCount <= 0) return callback(false);

                        const match = result.rows[0].content;
                        if (!match.rounds || match.rounds.length < round) return callback(false);
                        match.rounds[round].draftDate = date;
                        DbHelper.rawQuery(`UPDATE matches
                                           SET content = $3
                                           WHERE id = $1
                                             AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(match)])
                            .then(r => callback(r.rowCount > 0))
                            .catch(_ => callback(false))
                    }).catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:setFightWinner', (tournamentId, matchId, round, winner, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);
                DbHelper.rawQuery(`SELECT content
                                   FROM matches
                                   WHERE id = $1
                                     AND "tournamentId" = $2
                                   LIMIT 1`, [matchId, tournamentId])
                    .then(result => {
                        if (result.rowCount <= 0) return callback(false);

                        const match = result.rows[0].content;
                        if (!match.rounds || match.rounds.length < round) return callback(false);
                        match.rounds[round].winner = winner;
                        DbHelper.rawQuery(`UPDATE matches
                                           SET content = $3
                                           WHERE id = $1
                                             AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(match)])
                            .then(r => callback(r.rowCount > 0))
                            .catch(_ => callback(false))
                    }).catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:setMatchDate', (tournamentId, matchId, date, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{date}', $3)
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(date)])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:setReferee', (tournamentId, matchId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{referee}', $3)
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(socket.data.user)])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:setWinner', (tournamentId, matchId, winnerId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{winner}', $3)
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(winnerId)])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    socket.on('tournament::referee:validateMatch', (tournamentId, matchId, callback) => {
        if (!callback) return;
        DbHelper.isTournamentReferee(tournamentId, socket.data.user)
            .then(isReferee => {
                if (!isReferee) return callback(false);

                DbHelper.rawQuery(`UPDATE matches
                                   SET content = jsonb_set(content, '{done}', $3)
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId, JSON.stringify(true)])
                    .then(result => callback(result.rowCount > 0))
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    });

    // TODO later adapt this to other tournament format
    socket.on('tournament::draftStart', (tournamentId, matchId, fightIndex, callback) => {
        if (!callback) return;
        DbHelper.rawQuery(`SELECT COUNT(*)
                           FROM drafts_data
                           WHERE id = $1`, [matchId + "-" + fightIndex])
            .then(data => {
                if (data.rowCount <= 0) return callback(false);
                if (data.rows[0].count > 0) return callback(true);

                DbHelper.rawQuery(`SELECT phase, content
                                   FROM matches
                                   WHERE id = $1
                                     AND "tournamentId" = $2`, [matchId, tournamentId])
                    .then(result => {
                        if (result.rowCount <= 0) return callback(false);

                        const phase: number = result.rows[0].phase;
                        const match: TournamentMatchModel = result.rows[0].content;
                        if (match.rounds.length <= fightIndex) return callback(false);

                        DbHelper.rawQuery(`SELECT content
                                           FROM teams
                                           WHERE id = ANY ($1)`, [[match.teamA, match.teamB]])
                            .then(teams => {
                                if (teams.rowCount < 2) return callback(false);
                                let teamA: TournamentTeamModel;
                                let teamB: TournamentTeamModel;

                                if (phase == 1) {
                                    const sort = teams.rows.map(r => r.content).sort(() => Math.random() - 0.5);
                                    teamA = sort[0];
                                    teamB = sort[1];
                                } else {
                                    // TODO v2:
                                    // - 16th: win at step 2 of phase 1 can pick side
                                    // - then random
                                    // - BO: first random, then loser will have hand
                                    throw new Error("Not implemented");
                                }

                                const draft: DraftData = {
                                    id: matchId + "-" + fightIndex,
                                    configuration: {
                                        leader: undefined,
                                        providedByServer: true,
                                        actions: DraftTemplates[0].actions
                                    },
                                    history: [],
                                    currentAction: 0,

                                    users: [],

                                    teamA: teamA.players.map((p: string) => {
                                        return {
                                            id: p,
                                            username: "",
                                            discriminator: "",
                                            captain: teamA.leader === p,
                                            present: false
                                        }
                                    }),
                                    teamAInfo: {
                                        id: teamA.id || "",
                                        name: teamA.name
                                    },
                                    teamAReady: false,
                                    teamB: teamB.players.map((p: string) => {
                                        return {
                                            id: p,
                                            username: "",
                                            discriminator: "",
                                            captain: teamB.leader === p,
                                            present: false
                                        }
                                    }),
                                    teamBInfo: {
                                        id: teamB.id || "",
                                        name: teamB.name
                                    },
                                    teamBReady: false
                                }

                                DbHelper.rawQuery(`INSERT INTO drafts_data
                                                   VALUES ($1, $2)`, [draft.id, draft])
                                    .then(success => callback(success.rowCount > 0))
                                    .catch(_ => callback(false))
                            })
                            .catch(_ => callback(false))
                    })
                    .catch(_ => callback(false))
            })
            .catch(_ => callback(false))
    })
}