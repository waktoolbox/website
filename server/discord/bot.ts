import {Client, GatewayIntentBits} from 'discord.js';

class Bot {
    private client?: Client;

    init() {
        return new Promise(async (resolve, reject): Promise<void> => {
            this.client = new Client({intents: GatewayIntentBits.DirectMessages});
            this.client.on('ready', () => {
                console.log("Discord bot is ready");
                if (process.env.OWNER_DISCORD_UID) {
                    this.sendPrivateMessage(process.env.OWNER_DISCORD_UID, "I'm up")
                }
            })

            this.client.login(process.env.DISCORD_TOKEN)
                .then(_ => resolve(_))
                .catch(error => {
                    console.error(error)
                    reject()
                })
        })
    }

    sendPrivateMessage(uid: string, message: string) {
        this.client?.users.fetch(uid)
            .then(user => {
                user.send(message).then(_ => _).catch(_ => _);
            })
            .catch(_ => _);
    }
}

export const DiscordBot = new Bot();