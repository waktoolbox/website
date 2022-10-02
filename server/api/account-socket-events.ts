import {Socket} from "socket.io";
import {DbHelper} from "../db/pg-helper";

export function registerAccountEvents(socket: Socket) {
    socket.on('account::findByName', (name, callback) => {
        DbHelper.rawQuery(`SELECT id, username, discriminator
                           FROM accounts
                           WHERE username ILIKE $1
                           LIMIT 5`, [name])
            .then(result => callback(result.rows))
            .catch(error => {
                console.error(error);
                callback([]);
            })
    })

    socket.on('account::findById', (id, callback) => {
        DbHelper.rawQuery(`SELECT id, username, discriminator
                           FROM accounts
                           WHERE id = $1
                           LIMIT 1`, [id])
            .then(result => callback(result.rows.length > 0 ? result.rows[0] : undefined))
            .catch(error => {
                console.error(error);
                callback(undefined);
            })
    })
}