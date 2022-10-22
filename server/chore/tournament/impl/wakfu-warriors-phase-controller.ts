import {
    TournamentDefinition,
    TournamentMatchRoundModel,
    TournamentPhaseController,
    TournamentPhaseData,
    TournamentPhaseDefinition
} from "../../../../client/src/utils/tournament-models";
import {
    WakfuWarriorsMatchModel,
    WakfuWarriorsPhaseOneData,
    WakfuWarriorsPhaseTwoData,
    WakfuWarriorsTeamModel
} from "../../../../common/tournament/impl/wakfu-warriors";
import * as crypto from "crypto";
import {DbHelper} from "../../../db/pg-helper";
import {DbMatch} from "../../../db/db-type-helper";

function allMatchesAreDoneForRound(tournamentId: string, phase: number, round: number): Promise<boolean> {
    return new Promise(resolve => {
        DbHelper.rawQuery(`SELECT COUNT(CASE WHEN content ->> ('done') = 'true' THEN 1 END) = COUNT(*) as done
                           FROM matches
                           WHERE "tournamentId" = $1
                             AND phase = $2
                             AND content ->> ('round') = $3`, [tournamentId, phase, JSON.stringify(round)])
            .then(result => resolve(result.rowCount <= 0 ? false : result.rows[0].done))
            .catch(_ => resolve(false))
    })
}

function getAllMatchesOfPhaseAndRoundOrderedByPool(tournamentId: string, phase: number, round: number): Promise<WakfuWarriorsMatchModel[]> {
    return new Promise(resolve => {
        DbHelper.rawQuery(`SELECT content
                           FROM matches
                           WHERE "tournamentId" = $1
                             AND phase = $2
                             AND content ->> ('round') = $3
                           ORDER BY content ->> ('pool')`, [tournamentId, phase, round])
            .then(result => resolve(result.rowCount <= 0 ? [] : result.rows.map(r => r.content)))
            .catch(_ => resolve([]))
    })
}

export class WakfuWarriorPhaseOne implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsPhaseOneData> {
    tournament: TournamentDefinition;
    definition: TournamentPhaseDefinition;
    data: WakfuWarriorsPhaseOneData;

    constructor(tournament: TournamentDefinition, definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseOneData) {
        this.tournament = tournament;
        this.definition = definition;
        this.data = data;
    }

    mustGoToNextPhase(): Promise<boolean> {
        if (this.data.currentRound !== 4) return Promise.resolve(false);
        return new Promise(resolve => allMatchesAreDoneForRound(this.tournament.id || "", this.definition.phase, 3).then(res => resolve(res)))
    }

    mustGoToNextRound(): Promise<boolean> {
        if (this.data.currentRound > 3) return Promise.resolve(false);
        return new Promise(resolve => allMatchesAreDoneForRound(this.tournament.id || "", this.definition.phase, this.data.currentRound - 1).then(res => resolve(res)))
    }

    initTeams(teams: string[]) {
        teams.forEach(team => this.data.teams.push({
            id: team,
        }))
    }

    // TODO later do something here to init from misc previous phase
    initTeamsFromPreviousRound(previousPhaseData: any): Promise<boolean> {
        throw new Error("Can't init with previous data from phase 1")
    }

    getAllMatchesOfPhase(phase: number): Promise<WakfuWarriorsMatchModel[]> {
        return new Promise(resolve => {
            DbHelper.rawQuery(`SELECT content
                               FROM matches
                               WHERE "tournamentId" = $1
                                 AND phase = $2`, [this.tournament.id, phase])
                .then(result => resolve(result.rowCount <= 0 ? [] : result.rows.map(r => r.content)))
                .catch(_ => resolve([]))
        })
    }

    prepareRound(): Promise<boolean> {
        return new Promise(async resolve => {
            if (this.data.currentRound == 0) return this.preparePhase().then(result => resolve(result)).catch(_ => resolve(false));

            const passedMatches = await this.getAllMatchesOfPhase(1);
            const winScore: Map<string, number> = new Map();
            for (const match of passedMatches) {
                if (!match.winner || match.winner === "") {
                    console.error(`Can't go to next phase for tournament ${this.tournament.id} due to match ${match.id}`);
                    return resolve(false);
                }
                const teamAScore = winScore.get(match.teamA);
                const teamBScore = winScore.get(match.teamB);

                if (match.teamA) winScore.set(match.teamA, match.winner === match.teamA ? (teamAScore || 0) + 1 : (teamAScore || 0) - 1)
                if (match.teamB) winScore.set(match.teamB, match.winner === match.teamB ? (teamBScore || 0) + 1 : (teamBScore || 0) - 1)
            }

            const teamsMap: Map<string, WakfuWarriorsTeamModel> = new Map()
            this.data.teams.forEach(t => teamsMap.set(t.id || "", t));
            const createdMatches = [];
            for (const pool of this.data.teamPool) {
                const index = this.data.teamPool.indexOf(pool);
                const teams: string[] = pool.teams
                    .filter(t => Math.abs((winScore.get(t || "") || 0)) < 2)
                    .sort(() => Math.random() - 0.5);
                if (!teams) continue;

                const opponents = new Set();

                // noinspection JSAssignmentUsedAsCondition
                for (let team: string | undefined; team = teams.pop();) {
                    if (opponents.has(team)) continue;
                    // tricky compute to identify sub-pool
                    const opponent = teams.find(t => !opponents.has(t) && t !== team && winScore.get(t || "") == winScore.get(team || ""));
                    opponents.add(opponent);

                    const uuid = crypto.randomUUID();
                    const match = {
                        id: uuid,
                        tournamentId: this.tournament.id,
                        phase: this.definition.phase,
                        content: {
                            id: uuid,
                            done: !opponent,
                            teamA: team || "",
                            teamB: opponent || "",
                            winner: !opponent ? team : undefined,
                            phase: this.definition.phase,
                            round: this.data.currentRound,
                            pool: index,
                            rounds: this.generateRoundForMatch(),
                        } as WakfuWarriorsMatchModel
                    };
                    this.data.matches.push(uuid)
                    pool.matches.push(uuid);
                    createdMatches.push(match);
                }
            }

            DbHelper.rawQuery(`INSERT INTO matches (id, "tournamentId", phase, content)
                               SELECT m.id, m."tournamentId", m.phase, m.content
                               FROM jsonb_populate_recordset(NULL::matches, $1) AS m`,
                [JSON.stringify(createdMatches)])
                .then(_ => resolve(true))
                .catch(_ => resolve(false))
        })
    }

    generateRoundForMatch() {
        const tournamentRoundDefinition = this.definition.roundModel.find(d => d.round == this.data.currentRound);

        const result = [];
        for (let i = 0; i < (tournamentRoundDefinition?.bo || 1); i++) {
            result.push({
                map: this.tournament.maps[Math.floor(Math.random() * this.tournament.maps.length)]
            })
        }
        return result;
    }

    preparePhase(): Promise<boolean> {
        const poolSize = this.definition.poolSize;
        const poolNumber = this.definition.poolNumber;

        if (!poolNumber || !poolSize) throw new Error("Bad configuration : missing pool information");

        const teams = [...this.data.teams].sort(() => Math.random() - 0.5)

        for (let i = 0; i < poolNumber; i++) {
            this.data.teamPool.push({
                teams: [],
                matches: []
            })
        }

        for (let i = 0; i < teams.length; i++) {
            this.data.teamPool[i % poolNumber].teams.push(teams[i].id);
        }

        this.data.currentRound = 1;
        return this.prepareRound();
    }

    static getBaseData(): WakfuWarriorsPhaseOneData {
        return {
            teams: [],
            currentRound: 0,
            matches: [],
            teamPool: []
        }
    }
}

export class WakfuWarriorPhaseTwo implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsPhaseTwoData> {
    tournament: TournamentDefinition;
    definition: TournamentPhaseDefinition;
    data: WakfuWarriorsPhaseTwoData;

    constructor(tournament: TournamentDefinition, definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseTwoData) {
        this.tournament = tournament;
        this.definition = definition;
        this.data = data;
    }

    mustGoToNextPhase(): Promise<boolean> {
        return Promise.resolve(false);
    }

    mustGoToNextRound(): Promise<boolean> {
        if (this.data.currentRound > 5) return Promise.resolve(false);
        return new Promise(resolve => allMatchesAreDoneForRound(this.tournament.id || "", this.definition.phase, this.data.currentRound - 1).then(res => resolve(res)))
    }

    // TODO later implement this to be able to start with this phase
    initTeams(teams: string[]) {
        throw new Error("Can't init this phase from start")
    }

    // TODO later improve signature to avoid any here
    initTeamsFromPreviousRound(previousPhaseData: TournamentPhaseData<any>): Promise<boolean> {
        return new Promise(resolve => {
            DbHelper.rawQuery(`SELECT content ->> ('winner')     as winner,
                                      content ->> ('pool')       as pool,
                                      MAX(content ->> ('round')) as round
                               FROM matches
                               WHERE "tournamentId" = $1
                                 AND phase = $2
                                 AND content ->> ('winner') IS NOT NULL
                               GROUP BY content ->> ('winner'), content ->> ('pool')
                               HAVING COUNT(*) >= 2;`, [this.tournament.id, this.definition.phase - 1])
                .then(result => {
                    if (result.rowCount <= 0) return resolve(false);

                    result.rows.forEach(row => {
                        this.data.teams.push({
                            id: row.winner,
                            poolOnPhaseOne: row.pool,
                            qualifyingStepOnPhaseOne: row.round
                        })
                    })

                    for (let i = 0; i < 4; i++) {
                        const qualifiedInPool = this.data.teams.filter(t => t.poolOnPhaseOne == i);
                        if (qualifiedInPool.length >= 8) continue;
                        const qualifiedInPhase2 = qualifiedInPool.filter(t => t.qualifyingStepOnPhaseOne == 2);
                        for (let j = qualifiedInPhase2.length; j < 4; j++) {
                            this.data.teams.push({
                                id: undefined as unknown as string,
                                poolOnPhaseOne: i,
                                qualifyingStepOnPhaseOne: 2
                            })
                        }
                        for (let j = qualifiedInPool.length - qualifiedInPhase2.length; j < 4; j++) {
                            this.data.teams.push({
                                id: undefined as unknown as string,
                                poolOnPhaseOne: i,
                                qualifyingStepOnPhaseOne: 3
                            })
                        }
                    }
                    resolve(true);
                })
                .catch(_ => resolve(false))
        })
    }

    preparePhase(): Promise<boolean> {
        const teams = [...this.data.teams].sort(() => Math.random() - 0.5)

        const baseStepForPoolStep2 = [1, 5, 3, 7]
        const baseStepForPoolStep3 = [8, 2, 6, 4]

        const usedPlaces = new Set();

        function firstValidPlace(pool: number, qualifyingStep: number): number | undefined {
            for (let i = (qualifyingStep == 2 ? baseStepForPoolStep2[pool] : baseStepForPoolStep3[pool]); i <= 32; i += 8) {
                if (usedPlaces.has(i)) continue;
                return i;
            }
            return undefined;
        }

        teams.forEach(team => {
            if (!team.poolOnPhaseOne || !team.qualifyingStepOnPhaseOne) return;
            const validPlace = firstValidPlace(team.poolOnPhaseOne, team.qualifyingStepOnPhaseOne);
            if (!validPlace) throw new Error("Can't find a valid place");
            this.data.basePlacement[validPlace] = team.id;
            usedPlaces.add(validPlace);
        })

        this.data.currentRound = 1;
        return this.prepareRound();
    }

    createMatch(team: string | undefined, opponent: string | undefined, pool: number, rounds: TournamentMatchRoundModel[]): DbMatch {
        const uuid = crypto.randomUUID();
        return {
            id: uuid,
            tournamentId: this.tournament.id,
            phase: this.definition.phase,
            content: {
                id: uuid,
                done: !opponent || !team,
                teamA: team || "",
                teamB: opponent || "",
                winner: !opponent ? team : (!team ? opponent : undefined),
                phase: this.definition.phase,
                round: this.data.currentRound,
                pool: pool,
                rounds: rounds,
            } as WakfuWarriorsMatchModel
        };
    }

    prepareRound(): Promise<boolean> {
        return new Promise(async resolve => {
            if (this.data.currentRound == 0) return this.preparePhase().then(result => resolve(result)).catch(_ => resolve(false));

            const generateRoundForMatch = (pickingSideTeam: string | undefined): TournamentMatchRoundModel[] => {
                const tournamentRoundDefinition = this.definition.roundModel.find(d => d.round == this.data.currentRound);

                const result = [];
                for (let i = 0; i < (tournamentRoundDefinition?.bo || 1); i++) {
                    result.push({
                        round: this.data.currentRound,
                        map: this.tournament.maps[Math.floor(Math.random() * this.tournament.maps.length)],
                        draftFirstPicker: (i == 0 ? pickingSideTeam : undefined)
                    })
                }
                return result;
            }

            const createdMatches: DbMatch[] = [];
            switch (this.data.currentRound) {
                case 1: {
                    let pool = 1;
                    this.data.basePlacement.forEach((entry, index) => {
                        if (index <= 0 || index > 31) return;
                        if (index % 2 == 0) return;
                        const team = this.data.teams.find(t => t.id === entry);
                        const opponentId = this.data.basePlacement[index + 1];
                        const pickingSide = (team?.qualifyingStepOnPhaseOne || 0) === 2 ? entry : opponentId;
                        createdMatches.push(this.createMatch(entry, opponentId, pool++, generateRoundForMatch(pickingSide)));
                    })
                    break;
                }
                case 2:
                case 3:
                case 4: {
                    const matches = await getAllMatchesOfPhaseAndRoundOrderedByPool(this.tournament.id || "", 2, this.data.currentRound - 1);
                    let pool = 1;
                    for (let i = 0; i < matches.length; i += 2) {
                        const first = matches[i];
                        const second = matches[i + 1];
                        createdMatches.push(this.createMatch(first?.winner, second?.winner, pool++, generateRoundForMatch(undefined)))
                    }
                    break;
                }
                case 5: {
                    const matches = await getAllMatchesOfPhaseAndRoundOrderedByPool(this.tournament.id || "", 2, this.data.currentRound - 1);
                    const first = matches[0];
                    const second = matches[1];

                    createdMatches.push(this.createMatch(first?.winner, second?.winner, 1, generateRoundForMatch(undefined)))
                    createdMatches.push(this.createMatch(first?.winner === first?.teamA ? first?.teamB : first?.teamA, second?.winner === second?.teamA ? second?.teamB : second?.teamA, 2, [
                        {
                            round: this.data.currentRound,
                            map: this.tournament.maps[Math.floor(Math.random() * this.tournament.maps.length)]
                        },
                        {
                            round: this.data.currentRound,
                            map: this.tournament.maps[Math.floor(Math.random() * this.tournament.maps.length)]
                        },
                        {
                            round: this.data.currentRound,
                            map: this.tournament.maps[Math.floor(Math.random() * this.tournament.maps.length)]
                        }
                    ]))
                    break;
                }
            }

            createdMatches.forEach(match => this.data.matches.push(match.id))
            DbHelper.rawQuery(`INSERT INTO matches (id, "tournamentId", phase, content)
                               SELECT m.id, m."tournamentId", m.phase, m.content
                               FROM jsonb_populate_recordset(NULL::matches, $1) AS m`,
                [JSON.stringify(createdMatches)])
                .then(_ => resolve(true))
                .catch(_ => resolve(false))
        })
    }

    static getBaseData(): WakfuWarriorsPhaseTwoData {
        return {
            basePlacement: [],
            teams: [],
            currentRound: 0,
            matches: []
        }
    }
}
