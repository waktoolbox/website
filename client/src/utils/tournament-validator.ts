import {TournamentDefinition, TournamentTeamModel} from "./tournament-models";

export function validateTournamentDefinition(definition: TournamentDefinition, now: number): string[] | undefined {
    const errors = [];

    if (!definition.name || definition.name.length <= 0) errors.push("tournament.errors.missing.name");
    if (!definition.startDate) errors.push("tournament.errors.missing.startDate");
    if (!definition.endDate) errors.push("tournament.errors.missing.endDate");
    if (!definition.level) errors.push("tournament.errors.missing.level");
    // if(!definition.maps || definition.maps.length <= 0) errors.push("tournament.errors.missing.maps");

    if (definition.startDate && Date.parse(definition.startDate) < now) errors.push("tournament.errors.badStartDate");
    if (definition.startDate && definition.endDate && definition.startDate >= definition.endDate) errors.push("tournament.errors.badEndDate");
    if (definition.level && (definition.level <= 0 || definition.level > 230)) errors.push("tournament.errors.badLevel");
    if (definition.teamNumber && (definition.teamNumber <= 0 || definition.teamNumber > 64)) errors.push("tournament.errors.teamNumber");
    if (definition.teamNumber <= 0 || definition.teamNumber > 64) errors.push("tournament.errors.teamNumber");

    return errors.length <= 0 ? undefined : errors;
}

const servers = ["Pandora", "Rubilax"]

export function validateTournamentTeam(team: TournamentTeamModel): string[] | undefined {
    const errors = [];

    if (!team.name || team.name.length <= 0) errors.push("tournament.errors.missing.name");
    if (team.name && team.name.length > 25) errors.push("tournament.errors.too.big.name");
    if (team.players && team.players.length > 6) errors.push('tournament.errors.teamTooBig');
    if (!servers.includes(team.server)) errors.push("tournament.errors.badServer");
    if (team.catchPhrase && team.catchPhrase.length > 75) errors.push("tournament.errors.too.big.catchPhrase");

    return errors.length <= 0 ? undefined : errors;
}