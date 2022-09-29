import dotenv from "dotenv";
import express, {Express, Request, Response} from "express";
import * as http from 'http';
import path from "path";
import cors from "cors";
import {doOAuth} from "./server/oauth/discord";
import {Server} from 'socket.io';
import {SocketManager} from "./server/api/socket-manager";
import {DynamoDb} from "./server/db/db-helper";

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: '*'}});
SocketManager.initIo(io);

const __dirname = path.resolve();

dotenv.config({path: path.join(__dirname, '.env')});
DynamoDb.init();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, process.env.CLIENT_FILE_LOCATION || '')));

app.get('/api/oauth/discord/redirect', async (req: Request, res: Response) => {
    doOAuth(req.query.code as string).then(token => {
        res.redirect(301, process.env.LOGON_REDIRECTION + `?token=${token}` || "")
    }).catch(error => {
        console.error(error);
        res.status(400).send(); // TODO manage bad OAuth
    })
})

app.get('/*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, process.env.CLIENT_FILE_LOCATION || '', 'index.html'));
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
