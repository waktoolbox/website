import {
    TournamentPhaseController,
    TournamentPhaseDefinition,
    TournamentTeamModel
} from "../../../../common/tournament/tournament-models";
import {
    WakfuWarriorsMatchModel,
    WakfuWarriorsPhaseOneData,
    WakfuWarriorsTeamModel
} from "../../../../common/tournament/impl/wakfu-warriors";

export class WakfuWarriorPhaseOne implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel, WakfuWarriorsPhaseOneData> {
    definition: TournamentPhaseDefinition;
    data: WakfuWarriorsPhaseOneData;

    constructor(definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseOneData) {
        this.definition = definition;
        this.data = data;
    }

    getQualifiedTeams(): TournamentTeamModel[] {
        return [...this.data.teams.filter(t => t.winInPhaseOne >= 2)];
    }

    mustGoToNextPhase(): boolean {
        return this.data.currentRound == 4 && this.data.matches.filter(m => !m.done).length == 0;
    }

    prepareRound(): void {
        if (this.data.currentRound == 0) return this.preparePhase();

        const teamsMap: Map<String, WakfuWarriorsTeamModel> = new Map()
        this.data.teams.forEach(t => teamsMap.set(t.id || "", t));
        for (const pool of this.data.teamPool) {
            const teams: (WakfuWarriorsTeamModel | undefined)[] = pool.teams
                .map(id => teamsMap.get(id))
                .filter(t => t?.winInPhaseOne || 0 >= 2);
            if (!teams) {
                // TODO what do we do if there is no teams
                return;
            }

            // noinspection JSAssignmentUsedAsCondition
            for (let team: WakfuWarriorsTeamModel | undefined; team = teams.pop();) {
                // tricky compute to identify sub-pool
                const opponent = teams.find(t => t?.winInPhaseOne == team?.winInPhaseOne);

                if (!opponent) {
                    team.winInPhaseOne++;
                    continue; // no opponent for any possible reason: it's an auto win
                }

                this.data.matches.push({
                    done: false,
                    teamA: team.id || "",
                    teamB: opponent.id || "",
                    round: this.data.currentRound
                })
            }
        }
    }

    preparePhase() {
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
        this.prepareRound();
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