import {Socket} from "socket.io";
import {DynamoDb} from "../../db/db-helper";
import {TournamentDefinition} from "../../../common/tournament/tournament-models";
import * as crypto from "crypto";
import {validateTournamentDefinition} from "../../../client/src/utils/tournament-validator"; // TODO sorry, lack of time

function getTournament(id: string, callback: (command: TournamentDefinition) => void, socket: Socket) {
    DynamoDb.query({
        TableName: 'tournaments',
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ScanIndexForward: false,
        Limit: 1
    })
        .then(result => {
            if (!result || !result.Items || result.Items.length <= 0) return socket?.emit('error', 'tournament.not.found');
            callback((result?.Items || [undefined])[0] as TournamentDefinition)
        })
        .catch(_ => socket?.emit('error', 'tournament.not.found'));
}

export function registerTournamentEvents(socket: Socket) {
    socket.on('tournament::get', (id, callback) => {
        getTournament(id, callback, socket);
    });
}

export function registerLoggedInTournamentEvents(socket: Socket) {
    socket.on('tournament::setBaseInformation', (id, data, callback) => {
        const validationResult = validateTournamentDefinition(data as TournamentDefinition, Date.now());
        if (validationResult != undefined) return socket.emit('error', 'tournament.cant.save');

        if (!id) {
            const tournament = {
                ...data
            } as TournamentDefinition
            tournament.id = crypto.randomUUID();
            tournament.admins = [];
            tournament.admins.push(socket.data.user);
            DynamoDb.put("tournaments", tournament)
                .then(_ => callback(tournament))
                .catch(_ => socket.emit('error', 'tournament.cant.create'));
        }

        DynamoDb.query({
            TableName: 'tournaments',
            KeyConditionExpression: "id = :id",
            ExpressionAttributeValues: {
                ":id": id
            },
            ScanIndexForward: false,
            Limit: 1
        }).then(result => {
            if (!result || !result.Items || result.Items.length <= 0) return socket?.emit('error', 'tournament.not.found');

            const tournament: TournamentDefinition = result.Items[0] as TournamentDefinition;
            if (!tournament.admins || !tournament.admins.includes(socket.data.user)) return socket.emit('error', 'tournament.cant.save');

            DynamoDb.update("tournaments", id, data)
                .then(_ => callback(true))
                .catch(_ => socket.emit('error', 'tournament.cant.save'));
        }).catch(error => {
            socket.emit('error', 'tournament.cant.save')
        });

    });
}