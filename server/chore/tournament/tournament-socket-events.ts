import {Socket} from "socket.io";
import {DynamoDb} from "../../db/db-helper";

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        DynamoDb.get('tournament', id)
            .then(result => callback(result))
            .catch(_ => socket.emit('error', 'tournament.not.found'));
    })
}

export function registerLoggedInTournamentEvents(socket: Socket) {

}