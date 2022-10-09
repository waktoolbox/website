import {Socket} from "socket.io";
import {DbHelper} from "../db/pg-helper";

export function registerAccountEvents(socket: Socket) {
    socket.on('account::findByName', (name, callback) => {
        if (!callback) return;
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
        if (!callback) return;
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

    socket.on('account::findByIds', (ids, callback) => {
        if (!callback) return;
        if (!ids || ids.length > 100) return callback(undefined);
        DbHelper.rawQuery(`SELECT id, username, discriminator
                           FROM accounts
                           WHERE id = ANY ($1)
                           LIMIT $2`, [ids, ids.length])
            .then(result => callback(result.rows.length > 0 ? result.rows : undefined))
            .catch(error => {
                console.error(error);
                callback(undefined);
            })
    })
}

export function registerAccountLoggedInEvents(socket: Socket) {
    socket.on('account::myAccount', callback => {
        DbHelper.rawQuery(`SELECT id, username, discriminator, "ankamaName", "ankamaDiscriminator", "twitchUrl"
                           FROM accounts
                           WHERE id = $1
                           LIMIT 1`, [socket.data.user])
            .then(result => callback(result.rows.length > 0 ? result.rows[0] : undefined))
            .catch(error => {
                console.error(error);
                callback(undefined);
            })
    });

    socket.on("account::updateMyAccount", (ankamaName, ankamaDiscriminator, twitchUrl) => {
        console.log(arguments)
        DbHelper.rawQuery(`UPDATE accounts
                           SET "ankamaName" = $2,
                               "ankamaDiscriminator" = $3,
                               "twitchUrl" = $4
                           WHERE id = $1`,
            [socket.data.user, ankamaName, ankamaDiscriminator, twitchUrl])
            .then(result => {
                if (result.rowCount <= 0) return socket.emit("error", "account.unableToSave");
                socket.emit("success", "account.saved")
            })
            .catch(error => socket.emit("error", "account.unableToSave"));
    })
}