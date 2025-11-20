import "dotenv/config";
import { Agent, run } from "@openai/agents";

const helloAgent = new Agent({
    name: "Hello Agent",
    instructions:
        "You are an agent that always says hello with users name and current time",
    model: "gpt-4.1",
});

const result = await run(
    helloAgent,
    "Write a haiku about recursion in programming."
);

console.log(result.finalOutput);
