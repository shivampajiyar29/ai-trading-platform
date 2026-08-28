declare module 'node:crypto' {
  export function randomBytes(size: number): {
    toString(encoding: 'hex'): string;
  };
  export function scryptSync(
    password: string,
    salt: string,
    keylen: number,
  ): {
    toString(encoding: 'hex'): string;
  };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}
