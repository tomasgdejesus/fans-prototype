// Add Better Auth with its Drizzle adapter (provider: "pg") when implementing auth.
// Use the request's database connection; do not cache auth with a live pool globally.
// Use advanced.database.generateId: () => uuidv7() with uuid's v7 import.
export {};
