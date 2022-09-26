import jwt from 'jsonwebtoken';

let secret = process.env.JWT_SECRET;

function loadSecret() {
    secret = process.env.JWT_SECRET;
    if(!secret) {
        throw new Error("No env found for JWT_SECRET")
    }
}

export interface TokenContent {
    discord_id: string
}

export function createToken(content: TokenContent) {
    if(!secret) {
        loadSecret();
    }
    return jwt.sign(content, secret as string, {
        expiresIn: '1 day'
    });
}

export function verifyToken(token: string): TokenContent | undefined {
    if(!secret) {
        loadSecret();
    }
    try {
        return jwt.verify(token, secret as string) as TokenContent;
    } catch (error) {
        return undefined;
    }
}