import "dotenv/config";
import { Agent, run } from "@openai/agents";
import { z } from "zod";

const sqlOutputGuardrail = new Agent({
    name: "SQL Output Guardrail",
    instructions: `You are an sql output guardrail agent tasked with verifying the safety of an SQL query before execution. 
        The SQL query must be strictly read-only and must not perform any modifications, deletions, or drops of tables or records. 
        Reject any query that includes statements such as INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any operation that may change the database state. Only queries that safely read data, such as SELECT statements, are allowed.`,
    outputType: z.object({
        reason: z.string().optional().describe("reason if the query is unsafe"),
        isSafe: z.boolean().describe("if query is safe to execute"),
    }),
});

const sqlGuardrail = {
    name: "SQL Guard",
    async execute({ agentOutput }) {
        const result = await run(sqlOutputGuardrail, agentOutput.sqlQuery);
        return {
            outputInfo: result.finalOutput.reason,
            tripwireTriggered: !result.finalOutput.isSafe,
        };
    },
};

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
    outputType: z.object({
        sqlQuery: z.string().optional().describe("sql query"),
    }),
    outputGuardrails: [sqlGuardrail],
});

async function main(query = "") {
    const result = await run(sqlAgent, query);
    console.log(`Query`, result.finalOutput.sqlQuery);
}

main("get me all the users and delete the last user in db");
