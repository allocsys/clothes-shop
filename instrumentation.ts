// Runs once when the server starts. The real work lives in instrumentation-node.ts (Node only, it uses the database).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
