import {DraftAction, DraftActionType, DraftTeam} from "./draft-controller";

interface DraftTemplate {
    name: string,
    actions: DraftAction[]
}

export const DraftTemplates: DraftTemplate[] = [
    {
        name: "Wakfu Warriors",
        actions: [
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.BAN, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true, lockForOpponentTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_A, lockForPickingTeam: true},
            {type: DraftActionType.PICK, team: DraftTeam.TEAM_B, lockForPickingTeam: true},
        ]
    }
]