import {
    TournamentPhaseController,
    TournamentPhaseData,
    TournamentPhaseDefinition,
    TournamentPhaseType
} from "@common/tournament/tournament-models";
import {WakfuWarriorPhaseOne} from "./impl/wakfu-warriors-phase-controller";
import {WakfuWarriorsPhaseOneData} from "@common/tournament/impl/wakfu-warriors";

export function getAppropriateController(phase: TournamentPhaseType, definition: TournamentPhaseDefinition, data: TournamentPhaseData<any, any>): TournamentPhaseController<any, any, any> {
    switch (phase) {
        case TournamentPhaseType.NONE:
            throw new Error("No phase provided");
        case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
            return new WakfuWarriorPhaseOne(definition, data as WakfuWarriorsPhaseOneData);
    }
}

export function getBaseData(phase: TournamentPhaseType): TournamentPhaseData<any, any> {
    switch (phase) {
        case TournamentPhaseType.NONE:
            throw new Error("No phase provided");
        case TournamentPhaseType.WAKFU_WARRIORS_ROUND_ROBIN:
            return WakfuWarriorPhaseOne.getBaseData();
    }
}