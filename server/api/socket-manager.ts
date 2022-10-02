import {Server, Socket} from "socket.io";
import {verifyToken} from "../oauth/token";
import {registerLoggedInTournamentEvents, registerTournamentEvents} from "../chore/tournament/tournament-socket-events";
import {registerAccountEvents} from "./account-socket-events";

class Manager {
    private io?: Server;

    initIo(io: Server) {
        this.io = io;

        this.io.on('connection', socket => {
            socket.on('authenticate', (token, callback) => {
                const tokenContent = verifyToken(token);
                if (!tokenContent) {
                    callback(false);
                    return socket.disconnect();
                }
                socket.data.user = tokenContent.discord_id;
                registerLoggedInEvents(socket)
                callback(true);
            });

            registerEvents(socket)
        })
    }
}

function registerEvents(socket: Socket) {
    registerAccountEvents(socket);
    registerTournamentEvents(socket);
}

function registerLoggedInEvents(socket: Socket) {
    registerLoggedInTournamentEvents(socket);
}

export const SocketManager = new Manager();