import {
    TournamentPhaseController,
    TournamentPhaseData,
    TournamentPhaseDefinition
} from "../../../../common/tournament/tournament-models";
import {
    WakfuWarriorsMatchModel,
    WakfuWarriorsPhaseOneData,
    WakfuWarriorsPhaseTwoData,
    WakfuWarriorsTeamModel
} from "../../../../common/tournament/impl/wakfu-warriors";

export class WakfuWarriorPhaseOne implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel, WakfuWarriorsPhaseOneData> {
    definition: TournamentPhaseDefinition;
    data: WakfuWarriorsPhaseOneData;

    constructor(definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseOneData) {
        this.definition = definition;
        this.data = data;
    }

    getQualifiedTeams(): string[] {
        return [...(this.data.teams.filter(t => t.winInPhaseOne >= 2).map(t => t.id) as string[])];
    }

    mustGoToNextPhase(): boolean {
        // TODO v2 migrate to a db request
        return this.data.currentRound == 4 && this.data.matches.filter(m => !m.done).length == 0;
    }

    mustGoToNextRound(): boolean {
        return false;
    }

    initTeams(teams: string[]) {
        teams.forEach(team => this.data.teams.push({
            id: team,
            winInPhaseOne: 0
        }))
    }

    // TODO later do something here to init from misc previous phase
    initTeamsFromPreviousRound(previousPhaseData: any, qualifiedTeams: string[]) {
        throw new Error("Can't init with previous data from phase 1")
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
                // TODO v2 what do we do if there is no teams
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
                    id: "TODO", // TODO v2 generate id here
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

// TODO v2
export class WakfuWarriorPhaseTwo implements TournamentPhaseController<WakfuWarriorsTeamModel, WakfuWarriorsMatchModel, WakfuWarriorsPhaseTwoData> {
    data: WakfuWarriorsPhaseTwoData;
    definition: TournamentPhaseDefinition;

    constructor(definition: TournamentPhaseDefinition, data: WakfuWarriorsPhaseTwoData) {
        this.definition = definition;
        this.data = data;
    }

    getQualifiedTeams(): string[] {
        return [];
    }

    mustGoToNextPhase(): boolean {
        return false;
    }

    mustGoToNextRound(): boolean {
        return false;
    }

    initTeams(teams: string[]) {

    }

    // TODO later improve signature to avoid any here
    initTeamsFromPreviousRound(previousPhaseData: TournamentPhaseData<any, any>, qualifiedTeams: string[]) {
        const previous = previousPhaseData as WakfuWarriorsPhaseOneData;
    }

    prepareRound(): void {
    }

    static getBaseData(): WakfuWarriorsPhaseTwoData {
        return {
            teams: [],
            currentRound: 0,
            matches: []
        }
    }
}
