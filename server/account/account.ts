import {DynamoDb} from "../db/db-helper";

export class Account {
    id!: string;
    email!: string;

    async save() {
        return await DynamoDb.put("accounts", this);
    }
}