
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import path from "path";
import cors from "cors";
import {doOAuth} from "./server/oauth/discord";

const app: Express = express();
const __dirname = path.resolve();

dotenv.config({path: path.join(__dirname, '.env')});

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

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
