import {DbHelper} from "../../db/pg-helper";
import {TournamentMatchModel, TournamentTeamModel} from "../../../client/src/utils/tournament-models";

function createClassStats(breed: number, team: TournamentTeamModel) {
    const stats = team?.stats?.statsByClass;
    if (stats) stats[breed] = {
        id: breed,
        played: 0,
        banned: 0,
        victories: 0,
        killed: 0,
        death: 0
    }
}

function applyToTeam(match: TournamentMatchModel, team: TournamentTeamModel) {
    if (!team) return;

    if (!team.stats) team.stats = {
        played: 0,
        victories: 0,
        statsByClass: []
    };
    team.stats.played++;
    if (team.id === match.winner) team.stats.victories++;

    match.rounds.forEach(round => {
        const fightStats = team.id === match.teamA ? round.teamAStats : round.teamBStats;
        fightStats?.killedBreeds?.forEach((killed, index) => {
            if (!killed) return;
            if (!team.stats) return;
            if (!team.stats.statsByClass[index]) createClassStats(index, team);

            if (team.stats.statsByClass[index]) team.stats.statsByClass[index].death++;
        });
        fightStats?.killerBreeds?.forEach((killed, index) => {
            if (!killed) return;
            if (!team.stats) return;
            if (!team.stats.statsByClass[index]) createClassStats(index, team);

            if (team.stats.statsByClass[index]) team.stats.statsByClass[index].killed += +killed;
        });

        const draft = team.id === match.teamA ? round.teamADraft : round.teamBDraft;
        draft?.pickedClasses?.forEach((picked) => {
            if (!picked) return;
            if (!team.stats) return;
            if (!team.stats.statsByClass[picked]) createClassStats(picked, team);

            if (team.stats.statsByClass[picked]) {
                team.stats.statsByClass[picked].played++;
                team.stats.statsByClass[picked].victories += (round.winner === team.id ? 1 : 0);
            }
        });
        draft?.bannedClasses?.forEach((banned) => {
            if (!banned) return;
            if (!team.stats) return;
            if (!team.stats.statsByClass[banned]) createClassStats(banned, team);

            if (team.stats.statsByClass[banned]) team.stats.statsByClass[banned].banned++;

        });
    })
}

export function applyStatistics(tournamentId: string, matchId: string, skipDone: boolean, callback: (result: boolean) => any) {
    DbHelper.updateMatch(tournamentId, matchId, match => {
        return new Promise((resolve, reject) => {
            if (match.done && skipDone) return callback(false);

            if (skipDone) match.done = true;

            DbHelper.getTeams([match.teamA, match.teamB])
                .then(result => {
                    result.forEach(team => applyToTeam(match, team))

                    Promise.all(result.map(team => DbHelper.saveTeam(team)))
                        .then(result => {
                            if (result.find(p => p === undefined)) return callback(false) && resolve(undefined);

                            resolve(match);
                        })
                        .catch(_ => callback(false) && resolve(undefined))
                })
                .catch(_ => callback(false) && resolve(undefined))
        });
    })
        .then(result => callback(result))
        .catch(_ => callback(false))
}

export function recomputeAllStatistics(tournamentId: string, callback: (result: boolean) => any) {
    DbHelper.rawQuery(`UPDATE teams
                       SET content = jsonb_set(content, '{stats}', 'null')
                       WHERE content ->> ('tournament') = $1`, [tournamentId])
        .then(_ => {
            DbHelper.rawQuery(`SELECT id
                               FROM matches
                               WHERE "tournamentId" = $1`, [tournamentId])
                .then(async result => {
                    if (result.rowCount <= 0) return callback(false);

                    function apply(pop: any) {
                        if (!pop) return;
                        applyStatistics(tournamentId, pop.id, false, () => {
                            apply(result.rows.pop());
                        })
                    }

                    apply(result.rows.pop());
                })
                .catch(_ => callback(false))
        })
        .catch(_ => callback(false));

}