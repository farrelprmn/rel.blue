import mysql from "mysql2/promise";

// one MySQL pool per server process (settings from .env). dev reloads this module on every edit,
// so the pool is kept on globalThis there instead of opening a new one each time
const db =
  globalThis.__db ??
  mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
  });
if (process.env.NODE_ENV !== "production") globalThis.__db = db;

export default db;
