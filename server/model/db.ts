import { Pool, PoolConfig } from "pg";

// Ensure all required environment variables are defined
const requiredEnvVars = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DATABASE', 'POSTGRES_URL'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});

const poolConfig: PoolConfig = {
    connectionString: process.env.POSTGRES_URL,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false
    },
    min: 0,
};

export const client = new Pool(poolConfig);

client.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch((err) => console.error('Error connecting to PostgreSQL database', err));

