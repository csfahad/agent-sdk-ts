import "dotenv/config";
import { Agent, run } from "@openai/agents";

const agent = new Agent({
    name: "Storyteller Agent",
    instructions: `You are a storyteller. You will be given a topic and you will tell a story about it.`,
});

async function* streamOutput(query: string) {
    const result = await run(agent, query, { stream: true });
    const stream = result.toTextStream();

    for await (const val of stream) {
        yield { isCompleted: false, value: val };
    }
    yield { isCompleted: true, value: result.finalOutput };
}

async function main(query: string) {
    for await (const o of streamOutput(query)) {
        console.log(o);
    }
}

main("Tell me a stroy on mountains in 500 words");
