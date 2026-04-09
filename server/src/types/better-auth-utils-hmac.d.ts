declare module '@better-auth/utils/hmac' {
  export function createHMAC(
    algorithm?: string,
    encoding?: string,
  ): {
    sign(secret: string, input: string): Promise<string>;
    verify(secret: string, input: string, signature: string): Promise<boolean>;
  };
}
