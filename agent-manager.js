import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import fs from "node:fs/promises";

const fetchUserOrdersTool = tool({
    name: "fetch_user_orders",
    description: `fetches the all orders of user based on given user email`,
    parameters: z.object({
        phone: z.string().describe("registered email of the user"),
    }),
    execute: async function ({ email }) {
        return [
            { name: "Macbook Air M4", price: $1200 },
            { name: "iPhone 17 pro", price: $1000 },
        ];
    },
});

const cancelOrdersTool = tool({
    name: "cancel_user_orders",
    description: `This tool process the cancellation of user orders`,
    parameters: z.object({
        email: z.string().email().describe("email of the user"),
        reason: z.string().describe("reason for cancellation"),
    }),
    execute: async function () {
        await fs.appendFile(
            "./cancelled-orders.txt",
            `Order Cancellation for user ${email} having reason ${reason}`,
            "utf-8"
        );
        return { order_cancelled: true };
    },
});

const salesAgent = new Agent({
    name: "Sales Agent",
    instructions: `You are an expert sales agent for a multi tenant ecommerce business. Talk to the user and help them with what they need.`,
    tools: [
        fetchUserOrdersTool,
        cancelOrdersAgent.asTool({
            toolName: "cancel_orders_expert",
            toolDescription: "Handles the user orders cancellation",
        }),
    ],
});

const cancelOrdersAgent = new Agent({
    name: "Cancel users order Agent",
    instructions: `You are an expert operations agent for issuing cancellation of user orders.`,
    tools: [cancelOrdersTool],
});

async function runAgent(query = "") {
    const result = await run(salesAgent, query);
    console.log(result.finalOutput);
}

runAgent(
    "Hey there, i want to know about my orders, could you please guide me with this?"
);
