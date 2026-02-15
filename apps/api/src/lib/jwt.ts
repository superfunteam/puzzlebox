import { createHmac, randomUUID } from 'node:crypto';

export interface JwtClaims {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
  tid: string;
  scp: 'play' | 'admin';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signInput(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

export function signJwt(payload: Omit<JwtClaims, 'iat' | 'exp' | 'jti'>, secret: string, ttlSeconds: number): string {
  const iat = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    ...payload,
    iat,
    exp: iat + ttlSeconds,
    jti: randomUUID()
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = signInput(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtClaims | null {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expected = signInput(`${encodedHeader}.${encodedPayload}`, secret);
  if (expected !== signature) return null;

  const headerRaw = base64UrlDecode(encodedHeader);
  const header = JSON.parse(headerRaw) as { alg?: string };
  if (header.alg !== 'HS256') return null;

  const claims = JSON.parse(base64UrlDecode(encodedPayload)) as JwtClaims;
  if (claims.exp < Math.floor(Date.now() / 1000)) return null;

  return claims;
}
