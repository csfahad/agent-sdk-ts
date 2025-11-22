import { Agent, run, tool } from "@openai/agents";
import axios from "axios";
import { z } from "zod";

const GetNewsResultSchema = z.object({
    country: z.string().describe("name of the country"),
    headlines: z.string().describe("the main headlines of the news"),
});

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

const newsAgent = new Agent({
    name: "News Agent",
    instructions: `You are an expert headlines news agent that helps the user to summarize the last day news in headlines`,
    tools: [getNewsTool],
    outputType: GetNewsResultSchema,
});

async function runNewsAgent(query = "") {
    const result = await run(newsAgent, query);
    console.log(`News:`, result.finalOutput);
}

runNewsAgent(`Give me top news headlines of canada`);
