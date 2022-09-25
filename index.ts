
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import path from "path";
import cors from "cors";
import {doOAuth} from "./server/oauth/discord";
import {DynamoDb} from "./server/db/db-helper"; // imported for init purpose due to object creation

dotenv.config();

const app: Express = express();
const __dirname = path.resolve();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, './client/build')));

app.get('/api/oauth/discord/redirect', async (req: Request, res: Response) => {
    doOAuth(req.query.code as string).then(token => {
        res.redirect(301, process.env.LOGON_REDIRECTION + `?token=${token}` || "")
    }).catch(error => {
        res.status(400).send(); // TODO manage bad OAuth
    })
})

app.get('/*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, './client/build', 'index.html'));
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
