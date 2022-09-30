import {DbHelper} from "../db/pg-helper";

export class Account {
    id!: string;
    email!: string;
    username!: string;
    discriminator!: string;

    async save() {
        return await DbHelper.saveAccount(this);
    }
}