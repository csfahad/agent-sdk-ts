import "dotenv/config";
import { Agent, run, tool, RunContext } from "@openai/agents";
import { z } from "zod";

interface MyContext {
    userId: string;
    userName: string;
}

const getUserInfoTool = tool({
    name: "get_user_info",
    description: "Gets the user info",
    parameters: z.object({}),
    execute: async (_, ctx?: RunContext<MyContext>): Promise<string> => {
        return `UserId=${ctx?.context.userId}\nUsername=${ctx?.context.userName}`;
    },
});

const customerSupportAgent = new Agent<MyContext>({
    name: "Customer support Agent",
    instructions: `You're an expert customer support agent`,
    tools: [getUserInfoTool],
});

async function main(query: string, ctx: MyContext) {
    const result = await run(customerSupportAgent, query, {
        context: ctx,
    });
    console.log(`Result: `, result.finalOutput);
}

main("Hey, i forgot my name, what's that?", {
    userId: "1",
    userName: "Fahad",
});
