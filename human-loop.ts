import "dotenv/config";
import { Agent, tool, run } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import readline from "node:readline/promises";

const getNewsTool = tool({
    name: "get_news",
    description: `returns the top news headlines for the given country`,
    parameters: z.object({
        country: z.string().describe("name of the country"),
    }),
    execute: async function ({ country }) {
        const url = "https://news.google.com/rss?hl=en-CA&gl=CA&ceid=CA:en";
        const response = await axios.get(url, { responseType: "json" });
        return `Here are top news headlines for the ${country}: ${response.data}`;
    },
});

const sendEmailTool = tool({
    name: "send_email",
    description: `Sends email to the user`,
    parameters: z.object({
        to: z.string().describe("to email address"),
        subject: z.string().describe("subject of email"),
        html: z.string().describe("html body for the email"),
    }),
    needsApproval: true,
    execute: async ({ to, subject, html }) => {
        const API_KEY = "";
        const response = await axios.post(
            "email-provider-url",
            {
                from: {
                    email: "ai@csfahad.dev",
                    name: "AI News Agent",
                },
                to: {
                    email: to,
                },
                subject,
                html,
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            }
        );
        return response.data;
    },
});

const agent = new Agent({
    name: "News Email Agent",
    instructions: `You're an expert agent in getting the top news headlines and sending it using email`,
    tools: [getNewsTool, sendEmailTool],
});

async function askForUserConfirmation(ques: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const answer = await rl.question(`${ques} (y/n): `);
    const normalizedAnswer = answer.toLowerCase();
    rl.close();
    return normalizedAnswer === "y" || normalizedAnswer === "yes";
}

async function main(query: string) {
    let result = await run(agent, query);
    let hasInterruptions = result.interruptions?.length > 0;
    while (hasInterruptions) {
        const currentState = result.state;
        for (const interrupt of result.interruptions) {
            if (interrupt.type === "tool_approval_item") {
                const isAllowed = await askForUserConfirmation(
                    `${interrupt.agent.name} is asking for calling tool ${interrupt.name} with args ${interrupt.arguments}`
                );
                if (isAllowed) {
                    currentState.approve(interrupt);
                } else {
                    currentState.reject(interrupt);
                }
                result = await run(agent, currentState);
                hasInterruptions = result.interruptions?.length > 0;
            }
        }
    }
}

main(
    "What's the news headlines for canada today and send me on csfahad.dev@gmail.com"
);
