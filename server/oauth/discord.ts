import fetch from "node-fetch"
import {Account} from "../account/account";
import {createToken} from "./token";

interface OAuthResult {
    access_token: string,
    expires_in: number,
    refresh_token: string,
    scope: string,
    token_type: string
}

export async function doOAuth(code: string) {
    return new Promise((resolve, reject) => {
        fetch('https://discord.com/api/oauth2/token', {
            method: "POST", body: new URLSearchParams(
                {
                    client_id: process.env.CLIENT_ID || "",
                    client_secret: process.env.CLIENT_SECRET || "",
                    code: code,
                    scope: "email",
                    grant_type: "authorization_code",
                    redirect_uri: process.env.OAUTH_REDIRECTION || ""
                }
            )
        }).then(async response => {
            if (response.status !== 200) return reject(response.status);
            const data = (await response.json()) as any as OAuthResult
            getDiscordUser(data.access_token, data.token_type)
                .then(async result => {
                    if(result.status && result.status !== 200) return reject(result.status);
                    const discordData = (await result.json())

                    const account = new Account();
                    account.discordId = discordData.id;
                    account.email = discordData.email;
                    await account.save();

                    resolve(createToken({discord_id: account.discordId}));
                })
        });
    })
}

function getDiscordUser(token: string, tokenType: string): Promise<any> {
    return new Promise(resolve => {
        fetch("https://discord.com/api/users/@me", {
            method: "GET",
            headers: {
                Authorization: `${tokenType} ${token}`
            }
        }).then(result => resolve(result));
    });
}