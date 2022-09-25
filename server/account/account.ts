import {DynamoDb} from "../db/db-helper";

export class Account {
    discordId!: string;
    email!: string;

    async save() {
        return await DynamoDb.put("accounts", this);
    }
}