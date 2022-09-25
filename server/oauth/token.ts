import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if(!secret) {
    throw new Error("No env found for JWT_SECRET")
}

export interface TokenContent {
    discord_id: string
}

export function createToken(content: TokenContent) {
    return jwt.sign(content, secret as string, {
        expiresIn: '1 day'
    });
}

export function verifyToken(token: string): TokenContent | undefined {
    try {
        return jwt.verify(token, secret as string) as TokenContent;
    } catch (error) {
        return undefined;
    }
}