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
`