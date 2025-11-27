import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

let sharedHistory = [];

const executeSQL = tool({
    name: "execute_sql",
    description: "This executes the SQL query",
    parameters: z.object({
        sql: z.string().describe("the sql query"),
    }),
    execute: async function ({ sql }) {
        console.log(`[SQL]: Execute ${sql}`);
        return "done";
    },
});

const sqlAgent = new Agent({
    name: "SQL Expert Agent",
    instructions: `You are an expert SQL Agent that is specialized in generating sql queries as per user request.
        Postgresql Schema:
        -- users table
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- comments table
        CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        `,
    tools: [executeSQL],
});

async function main(query = "") {
    sharedHistory.push({ role: "user", content: query });
    const result = await run(sqlAgent, sharedHistory);
    sharedHistory = result.history;
    console.log(`Result`, result.finalOutput);
}

main(`Hey, I'm fahad`).then(() => {
    main(`Get me all the users with my name`);
});
