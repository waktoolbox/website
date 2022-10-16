import {
    TournamentDefinition,
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

export class WakfuWarriorPhaseOne implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsPhaseOneData> {
    tournament: TournamentDefinition;
    definition: TournamentPhaseDefinition;
    data: WakfuWarriorsPhaseOneData;

    constructor(tournament: TournamentDefinition, definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseOneData) {
        this.tournament = tournament;
        this.definition = definition;
        this.data = data;
    }

    getQualifiedTeams(): string[] {
        // TODO v3
        return [];
        // return [...(this.data.teams.filter(t => t.winInPhaseOne >= 2).map(t => t.id) as string[])];
    }

    mustGoToNextPhase(): Promise<boolean> {
        if (this.data.currentRound !== 4) return Promise.resolve(false);
        return new Promise(resolve => this.allMatchesAreDoneForRound(3).then(res => resolve(res)))
    }

    mustGoToNextRound(): Promise<boolean> {
        if (this.data.currentRound > 3) return Promise.resolve(false);
        return new Promise(resolve => this.allMatchesAreDoneForRound(this.data.currentRound - 1).then(res => resolve(res)))
    }

    initTeams(teams: string[]) {
        teams.forEach(team => this.data.teams.push({
            id: team,
        }))
    }

    // TODO later do something here to init from misc previous phase
    initTeamsFromPreviousRound(previousPhaseData: any, qualifiedTeams: string[]) {
        throw new Error("Can't init with previous data from phase 1")
    }

    allMatchesAreDoneForRound(round: number): Promise<boolean> {
        return new Promise(resolve => {
            DbHelper.rawQuery(`SELECT COUNT(CASE WHEN content ->> ('done') = 'true' THEN 1 END) = COUNT(*) as done
                               FROM matches
                               WHERE "tournamentId" = $1
                                 AND phase = $2
                                 AND content ->> ('round') = $3`, [this.tournament.id, this.definition.phase, JSON.stringify(round)])
                .then(result => resolve(result.rowCount <= 0 ? false : result.rows[0].done))
                .catch(_ => resolve(false))
        })
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
                    .filter(t => Math.abs((winScore.get(t || "") || 0)) < 2);
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
                teams: [...teams.slice(i * poolSize, i * poolSize + poolSize).map(t => t.id || "")],
                matches: []
            })
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

// TODO v3
export class WakfuWarriorPhaseTwo implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsPhaseTwoData> {
    data: WakfuWarriorsPhaseTwoData;
    definition: TournamentPhaseDefinition;

    constructor(tournament: TournamentDefinition, definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseTwoData) {
        this.definition = definition;
        this.data = data;
    }

    getQualifiedTeams(): string[] {
        return [];
    }

    mustGoToNextPhase(): Promise<boolean> {
        return Promise.resolve(false);
    }

    mustGoToNextRound(): Promise<boolean> {
        return Promise.resolve(false);
    }

    initTeams(teams: string[]) {

    }

    // TODO later improve signature to avoid any here
    initTeamsFromPreviousRound(previousPhaseData: TournamentPhaseData<any>, qualifiedTeams: string[]) {
        const previous = previousPhaseData as WakfuWarriorsPhaseOneData;
    }

    prepareRound(): Promise<boolean> {
        return new Promise((resolve, reject) => resolve(false));
    }

    static getBaseData(): WakfuWarriorsPhaseTwoData {
        return {
            teams: [],
            currentRound: 0,
            matches: []
        }
    }
}
