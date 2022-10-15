import {Server, Socket} from "socket.io";
import {verifyToken} from "../oauth/token";
import {registerLoggedInTournamentEvents, registerTournamentEvents} from "../chore/tournament/tournament-socket-events";
import {registerAccountEvents, registerAccountLoggedInEvents} from "./account-socket-events";
import {registerDraftEvents} from "../chore/draft/draft-socket-events";

class Manager {
    private _io?: Server;

    initIo(io: Server) {
        this._io = io;

        this._io.on('connection', socket => {
            registerEvents(socket)

            socket.on('authenticate', (token, callback) => {
                const tokenContent = verifyToken(token);
                if (!tokenContent) {
                    callback(false);
                    return socket.disconnect();
                }
                socket.data.user = tokenContent.discord_id;
                socket.data.username = tokenContent.username;
                socket.data.discriminator = tokenContent.discriminator;
                registerLoggedInEvents(socket)
                callback(true);
            });
        })
    }

    io(): Server | undefined {
        return this._io;
    }
}

function registerEvents(socket: Socket) {
    registerAccountEvents(socket);
    registerDraftEvents(socket);
    registerTournamentEvents(socket);
}

function registerLoggedInEvents(socket: Socket) {
    registerLoggedInTournamentEvents(socket);
    registerAccountLoggedInEvents(socket);
}

export const SocketManager = new Manager();