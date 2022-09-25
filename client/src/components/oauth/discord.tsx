import React from "react";

function DiscordOAuth() {
    return (
        <div>
            <a href="https://discord.com/api/oauth2/authorize?client_id=1022461229958168609&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Foauth%2Fdiscord%2Fredirect&response_type=code&scope=email">
                Auth with Discord
            </a>
        </div>
    );
}

export default DiscordOAuth;