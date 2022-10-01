import pg from 'pg';
import {pgInitDb} from "./pg-populate";
import {Account} from "../account/account";
import {TournamentDefinition} from "../../common/tournament/tournament-models";

class DbWrapper {
    private pool?: pg.Pool;
    private isInit: boolean = false;

    async init() {
        this.pool = new pg.Pool();
        await this.pool.connect()
        await this.pool.query(pgInitDb)
        this.isInit = true;
    }

    rawQuery(query: string, params: any[]) {
        return new Promise((resolve, reject) => {
            this.pool?.query(query, params)
                .then(result => resolve(result))
                .catch(error => reject(error));
        })
    }

    saveAccount(account: Account) {
        return new Promise((resolve, reject) => {
            this.pool?.query(`
                INSERT INTO accounts (id, username, discriminator, email)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE
                    SET username      = $2,
                        discriminator = $3,
                        email         = $4;
            `, [account.id, account.username, account.discriminator, account.email])
                .then(result => {
                    if (result.rowCount <= 0) return reject(undefined);
                    resolve(account);
                })
                .catch(error => reject(error));
        })
    }

    getTournament(id: string): Promise<TournamentDefinition | undefined> {
        return new Promise((resolve, reject) => {
            this.pool?.query(`SELECT content
                              FROM tournaments
                              WHERE id = $1`, [id])
                .then(result => {
                    if (result.rows.length <= 0) return reject(undefined);
                    resolve(result.rows[0].content as TournamentDefinition);
                })
                .catch(error => reject(error));
        });
    }

    saveTournament(tournament: TournamentDefinition) {
        return new Promise((resolve, reject) => {
            this.pool?.query(`INSERT INTO tournaments (id, content)
                              VALUES ($1, $2)
                              ON CONFLICT (id) DO UPDATE
                                  SET content = $2;`, [tournament.id, JSON.stringify(tournament)])
                .then(result => {
                    if (result.rowCount <= 0) return reject(false);
                    resolve(true)
                })
                .catch(error => reject(error));
        });
    }

    isTournamentAdmin(id: string, user: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool?.query(`SELECT COUNT(*)
                              FROM tournaments
                              WHERE id = $1
                                AND content -> ('admins') ? $2;`,
                [id, user])
                .then(result => {
                    resolve(result.rows && result.rows.length > 0 && result.rows[0].count > 0)
                })
                .catch(error => reject(error));
        });

    }
}

export const DbHelper = new DbWrapper();