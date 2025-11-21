import "dotenv/config";
import { Agent, run } from "@openai/agents";

const usersLLM = GPT;

const helloAgent = new Agent({
    name: "Hello Agent",
    instructions: function () {
        if (usersLLM === "GPT") {
            return `Greet to user with name and current time`;
        } else {
            return `Tell the user with username that try GPT, I'm more faster than your LLM`;
        }
    },
    model: "gpt-4.1",
});

const result = await run(
    helloAgent,
    "Write a haiku about recursion in programming."
);

console.log(result.finalOutput);
