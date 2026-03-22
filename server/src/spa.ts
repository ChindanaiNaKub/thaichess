import path from 'path';

export function shouldServeSpaShell(requestPath: string): boolean {
  return path.extname(requestPath) === '';
}
