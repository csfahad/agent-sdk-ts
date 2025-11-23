import "dotenv/config";
import { Agent, tool, run } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import { z } from "zod";

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

const cancelOrdersAgent = new Agent({
    name: "Cancel users order Agent",
    instructions: `You are an expert operations agent for issuing cancellation of user orders.`,
    tools: [cancelOrdersTool],
});

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

const customerSupportAgent = new Agent({
    name: "Customer Support Agent",
    instructions: `${RECOMMENDED_PROMPT_PREFIX} You are the customer-facing agent expert in understanding what customer needs and then divert or handoff them to the right agent`,
    handoffDescription: `You have two agents available:
        - salesAgent: Expert in handling/convincing about new items and products to the existing users.
        - cancelOrdersAgent: Expert in handling cancelling the placed or delivered orders for the existing users.
    `,
    handoffs: [salesAgent, cancelOrdersAgent],
});

async function main(query = "") {
    const result = await run(customerSupportAgent, query);
    console.log(`Result`, result.finalOutput);
    console.log(`History`, result.history);
}

// main(
//     `Hey there, can you please help me with my current orders and i want to cancel some of the orders`
// );

main(
    `Hey there, I am a user having email abc@example.com, and i want to cancel my iphone order cause i think the price has been little bit decreased`
);
