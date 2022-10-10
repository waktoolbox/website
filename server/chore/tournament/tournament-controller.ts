import {DbHelper} from "../../db/pg-helper";
import {TournamentDefinition, TournamentPhaseData} from "../../../common/tournament/tournament-models";
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

function getTournamentData(id: string, phase: number): Promise<TournamentPhaseData<any, any> | undefined> {
    return new Promise((resolve) => {
        DbHelper.getTournamentData(id, phase)
            .then(data => resolve(!data ? undefined : data.content))
            .catch(error => {
                console.error(error);
                resolve(undefined);
            })
    });
}

function insertTournamentData(id: string, phase: number, data: TournamentPhaseData<any, any>): Promise<boolean> {
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

function saveTournamentData(id: string, phase: number, data: TournamentPhaseData<any, any>): Promise<boolean> {
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

        let controller;

        if (isTournamentStart) {
            const baseData = getBaseData(phaseDefinition.phaseType);
            controller = getAppropriateController(tournament, phaseDefinition, baseData)

            const teams = await getValidTeamsWithLimitWithinTournament(id)
            if (!teams || teams.length <= 0) return resolve(false);

            // TODO later clean not selected teams
            controller.initTeams(teams)
            controller.prepareRound();
            return resolve(await insertTournamentData(id, maxPhase, controller.data));
        }

        const dbData = await getTournamentData(id, maxPhase);
        if (!dbData) {
            console.error(`No db tournament data for tournament ${id} phase ${maxPhase}`)
            return resolve(false);
        }
        controller = getAppropriateController(tournament, phaseDefinition, dbData)

        if (controller.mustGoToNextPhase()) {
            goToNextPhase().then(r => resolve(r)).catch(error => reject(error));
            return;
        }

        if (!controller.mustGoToNextRound()) {
            return reject("Can't go to next round");
        }

        controller.prepareRound();
        return resolve(await saveTournamentData(id, maxPhase, controller.data));
    })
}

function goToNextPhase(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // TODO v2
        // controller.initMaps(tournament.maps);
    })
}