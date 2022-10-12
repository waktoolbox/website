import {DraftAction, DraftActionType, DraftTeam} from "./draft-controller";

interface DraftTemplate {
    name: string,
    actions: DraftAction[]
}

export const DraftTemplates: DraftTemplate[] = [
    {
        name: "Wakfu Warriors",
        actions: [
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_A},
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_A},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_A},
            {type: DraftActionType.COMMON_BAN, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_B},
            {type: DraftActionType.COMMON_PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B},
        ]
    }
]