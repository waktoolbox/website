export const pgInitDb = `
    CREATE TABLE IF NOT EXISTS accounts
    (
        id VARCHAR
    (
        50
    ) PRIMARY KEY,
        username VARCHAR
    (
        50
    ) NOT NULL,
        discriminator VARCHAR
    (
        4
    ) NOT NULL,
        email VARCHAR
    (
        255
    ) NOT NULL
        );

    ALTER TABLE accounts
        ADD COLUMN IF NOT EXISTS "ankamaName" varchar (50);
    ALTER TABLE accounts
        ADD COLUMN IF NOT EXISTS "ankamaDiscriminator" varchar (5);
    ALTER TABLE accounts
        ADD COLUMN IF NOT EXISTS "twitchUrl" varchar (50);

    CREATE TABLE IF NOT EXISTS tournaments
    (
        id VARCHAR
    (
        50
    ) PRIMARY KEY,
        content JSONB
        );

    ALTER TABLE tournaments
        ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS teams
    (
        id VARCHAR
    (
        50
    ) PRIMARY KEY,
        content JSONB,
        createdAt TIMESTAMP NOT NULL DEFAULT now
    (
    )
        );

    CREATE TABLE IF NOT EXISTS tournaments_data
    (
        "tournamentId" VARCHAR
    (
        50
    ) NOT NULL,
        phase INT NOT NULL,
        content JSONB,
        PRIMARY KEY
    (
        "tournamentId",
        phase
    )
        );

`