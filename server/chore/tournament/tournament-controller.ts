import {DbHelper} from "../../db/pg-helper";
import {
    TournamentDefinition,
    TournamentMatchModel,
    TournamentPhaseData
} from "../../../client/src/utils/tournament-models";
import {getAppropriateController, getBaseData} from "./tournament-controller-mapper";

function getTournament(id: string): Promise<TournamentDefinition | undefined> {
    return new Promise((resolve) => {
        DbHelper.getTournament(id)
            .then(tournament => resolve(tournament))
            .catch(error => {
                console.error(error);
                resolve(undefined);
            })
    });
}

function getTournamentData(id: string, phase: number): Promise<TournamentPhaseData<any> | undefined> {
    return new Promise((resolve) => {
        DbHelper.getTournamentData(id, phase)
            .then(data => resolve(!data ? undefined : data.content))
            .catch(error => {
                console.error(error);
                resolve(undefined);
            })
    });
}

function insertTournamentData(id: string, phase: number, data: TournamentPhaseData<any>): Promise<boolean> {
    return new Promise((resolve) => {
        DbHelper.rawQuery(`INSERT INTO tournaments_data
                           VALUES ($1, $2, $3)`, [id, phase, JSON.stringify(data)])
            .then(result => resolve(result.rowCount > 0))
            .catch(error => {
                console.error(error);
                resolve(false);
            })
    });
}

function saveTournamentData(id: string, phase: number, data: TournamentPhaseData<any>): Promise<boolean> {
    return new Promise((resolve) => {
        DbHelper.rawQuery(`UPDATE tournaments_data
                           SET content = $3
                           WHERE "tournamentId" = $1
                             AND phase = $2`, [id, phase, JSON.stringify(data)])
            .then(result => resolve(result.rowCount > 0))
            .catch(error => {
                console.error(error);
                resolve(false);
            })
    });
}

function getValidTeamsWithLimitWithinTournament(id: string): Promise<string[] | undefined> {
    return new Promise((resolve) => {
        DbHelper.getTournamentTeamsWithLimit(id)
            .then(data => resolve(!data ? undefined : (data.map(t => t.content.id) as string[])))
            .catch(error => {
                console.error(error);
                resolve(undefined);
            })
    });
}

function getMaxPhase(id: string): Promise<number | undefined> {
    return new Promise((resolve) => {
        DbHelper.rawQuery(`SELECT MAX(phase) as max
                           FROM tournaments_data
                           WHERE "tournamentId" = $1`, [id])
            .then(result => resolve(result.rows[0].max || 0))
            .catch(error => {
                console.error(error);
                resolve(undefined);
            })
    })
}

export function getNextMatches(id: string, phase: number): Promise<TournamentMatchModel[]> {
    return new Promise((resolve) => {
        DbHelper.rawQuery(`SELECT content
                           FROM matches
                           WHERE "tournamentId" = $1
                             AND phase = $2
                             AND content ->> ('done') = 'false'`, [id, phase])
            .then(result => resolve(result.rowCount > 0 ? result.rows.map(r => r.content) : []))
            .catch(_ => resolve([]))
    })
}

export function getMatchesResult(id: string, phase: number): Promise<TournamentMatchModel[]> {
    return new Promise((resolve) => {
        DbHelper.rawQuery(`SELECT content
                           FROM matches
                           WHERE "tournamentId" = $1
                             AND phase = $2
                             AND content ->> ('done') = 'true'`, [id, phase])
            .then(result => resolve(result.rowCount > 0 ? result.rows.map(r => r.content) : []))
            .catch(_ => resolve([]))
    })
}

export function getMatch(id: string): Promise<TournamentMatchModel | undefined> {
    return new Promise(resolve => {
        DbHelper.rawQuery(`SELECT content
                           FROM matches
                           WHERE id = $1`, [id])
            .then(r => resolve(r.rowCount <= 0 ? undefined : r.rows[0].content))
            .catch(e => resolve(undefined));
    })
}

export function goToNextPhaseOrRound(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        const tournament = await getTournament(id);
        if (!tournament) return reject("No tournament found");
        if (!tournament.phases) return reject("No phases on tournament");

        const maxPhase = await getMaxPhase(id);
        if (maxPhase === undefined || maxPhase === null) return; // can't happen
        if (maxPhase >= tournament.phases.length) return resolve(false);

        const isTournamentStart = maxPhase === 0;
        const phaseDefinition = tournament.phases[isTournamentStart ? 0 : (maxPhase - 1)];

        if (isTournamentStart) {
            const baseData = getBaseData(phaseDefinition.phaseType);
            const controller = getAppropriateController(tournament, phaseDefinition, baseData)

            const teams = await getValidTeamsWithLimitWithinTournament(id)
            if (!teams || teams.length <= 0) return resolve(false);

            // TODO later clean not selected teams
            controller.initTeams(teams)
            controller.prepareRound()
                .then(prepared => {
                        if (!prepared) return resolve(false);
                        insertTournamentData(id, 1, controller.data)
                            .then(result => resolve(result))
                            .catch(_ => reject("Unable to save tournament data"))
                    }
                ).catch(error => reject("Unable to prepare round : " + error))
            return;
        }

        const dbData = await getTournamentData(id, maxPhase);
        if (!dbData) {
            console.error(`No db tournament data for tournament ${id} phase ${maxPhase}`)
            return resolve(false);
        }

        dbData.currentRound++;
        const controller = getAppropriateController(tournament, phaseDefinition, dbData)

        const mustGoToNextPhase = await controller.mustGoToNextPhase();
        if (mustGoToNextPhase) {
            goToNextPhase(tournament, maxPhase, dbData).then(r => resolve(r)).catch(error => reject(error));
            return;
        }

        const mustGoToNextRound = await controller.mustGoToNextRound();
        if (!mustGoToNextRound) {
            return resolve(false);
        }

        controller.prepareRound()
            .then(prepared => {
                if (!prepared) return resolve(false);
                    saveTournamentData(id, maxPhase, controller.data)
                        .then(result => resolve(result))
                        .catch(_ => reject("Unable to save tournament data"))
                }
            ).catch(error => reject("Unable to prepare round : " + error))
    })
}

function goToNextPhase(tournament: TournamentDefinition, currentPhase: number, previousData: TournamentPhaseData<any>): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (tournament.phases.length < currentPhase) return resolve(false);
        console.log(`Starting next phase for ${tournament.id}`)

        const phaseDefinition = tournament.phases[currentPhase]; // phase has a default +1

        const baseData = getBaseData(phaseDefinition.phaseType);
        const controller = getAppropriateController(tournament, phaseDefinition, baseData)
        controller.initTeamsFromPreviousRound(previousData)
            .then(success => {
                if (!success) return resolve(false);
                controller.prepareRound()
                    .then(prepared => {
                            if (!prepared) return resolve(false);
                            insertTournamentData(tournament.id || "", currentPhase + 1, controller.data)
                                .then(result => resolve(result))
                                .catch(_ => reject("Unable to save tournament data"))
                        }
                    ).catch(error => reject("Unable to prepare round : " + error))
            })
            .catch(_ => resolve(false))
    })
}