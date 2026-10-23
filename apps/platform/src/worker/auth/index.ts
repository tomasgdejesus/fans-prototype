// Add Better Auth with its Drizzle adapter (provider: "pg") when implementing auth.
// Use the request's database connection; do not cache auth with a live pool globally.
// Use advanced.database.generateId: false so PostgreSQL supplies IDs.
export {};
