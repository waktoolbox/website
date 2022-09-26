import React from "react";

function DiscordOAuth() {
    console.log(process.env);

    return (
        <div>

            <a href={process.env.REACT_APP_DISCORD_OAUTH_URL}>
            Auth with Discord
            </a>
        </div>
    );
}

export default DiscordOAuth;