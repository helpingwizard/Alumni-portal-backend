"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const pg_1 = require("pg");
// Ensure all required environment variables are defined
const requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});
const poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false
    },
    min: 0,
};
exports.client = new pg_1.Pool(poolConfig);
exports.client.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch((err) => console.error('Error connecting to PostgreSQL database', err));
