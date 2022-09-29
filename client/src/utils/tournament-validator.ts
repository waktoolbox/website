import {TournamentDefinition} from "../../../common/tournament/tournament-models";

export function validateTournamentDefinition(definition: TournamentDefinition, now: number): string[] | undefined {
    const errors = [];

    if (!definition.name || definition.name.length <= 0) errors.push("tournament.errors.missing.name");
    if (!definition.startDate) errors.push("tournament.errors.missing.startDate");
    if (!definition.endDate) errors.push("tournament.errors.missing.endDate");
    if (!definition.level) errors.push("tournament.errors.missing.level");
    // if(!definition.maps || definition.maps.length <= 0) errors.push("tournament.errors.missing.maps");

    if (definition.startDate && definition.startDate < now) errors.push("tournament.errors.badStartDate");
    if (definition.startDate && definition.endDate && definition.startDate >= definition.endDate) errors.push("tournament.errors.badEndDate");
    if (definition.level && (definition.level <= 0 || definition.level > 230)) errors.push("tournament.errors.badLevel");
    if (definition.teamNumber && (definition.teamNumber <= 0 || definition.teamNumber > 64)) errors.push("tournament.errors.teamNumber");
    if (definition.teamNumber <= 0 || definition.teamNumber > 64) errors.push("tournament.errors.teamNumber");

    return errors.length <= 0 ? undefined : errors;
}