import {
    TournamentDefinition,
    TournamentPhaseController,
    TournamentPhaseData,
    TournamentPhaseDefinition,
    TournamentPhaseType
} from "../../../common/tournament/tournament-models";
import {WakfuWarriorPhaseOne, WakfuWarriorPhaseTwo} from "./impl/wakfu-warriors-phase-controller";
import {WakfuWarriorsPhaseOneData, WakfuWarriorsPhaseTwoData} from "../../../common/tournament/impl/wakfu-warriors";

export function getAppropriateController(tournament: TournamentDefinition, definition: TournamentPhaseDefinition, data: TournamentPhaseData<any, any>): TournamentPhaseController<any, any, any> {
    switch (definition.phaseType) {
        case TournamentPhaseType.NONE:
            throw new Error("No phase provided");
        case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
            return new WakfuWarriorPhaseOne(tournament, definition, data as WakfuWarriorsPhaseOneData);
        case TournamentPhaseType.WAKFU_WARRIORS_BRACKET_TOURNAMENT:
            return new WakfuWarriorPhaseTwo(tournament, definition, data as WakfuWarriorsPhaseTwoData);
    }
}

export function getBaseData(phase: TournamentPhaseType): TournamentPhaseData<any, any> {
    switch (phase) {
        case TournamentPhaseType.NONE:
            throw new Error("No phase provided");
        case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
            return WakfuWarriorPhaseOne.getBaseData();
        case TournamentPhaseType.WAKFU_WARRIORS_BRACKET_TOURNAMENT:
            return WakfuWarriorPhaseTwo.getBaseData();
    }
}