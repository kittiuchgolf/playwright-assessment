export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and set a valid value.`);
  }

  return value;
}
