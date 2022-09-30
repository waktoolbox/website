# Env
PORT: run port (default 8000)  
CLIENT_ID: Discord OAuth client ID  
CLIENT_SECRET: Discord OAuth client secret  
JWT_SECRET: salt for JWT encryption  
OAUTH_REDIRECTION: local redirection for OAuth  
LOGON_REDIRECTION: home for redirection after OAuth  
CLIENT_FILE_LOCATION: path relative to working directory for client files root

AWS_ACCESS_KEY: AWS access key, must have DynamoDB rights  
AWS_SECRET_KEY: AWS secret key

PGUSER: DB user
PGHOST: DB host
PGPASSWORD: DB pass
PGDATABASE: DB database (...)
PGPORT: DB port

# Quick note

It's my first React project, I'm sorry, but it's a quite short deadline to do better for now  
For the same reason, I may be pushed some ugly conf files in this project. And the history is... quite ugly.

# Server setup

Create a correct PG database according to PGDATABASE env value