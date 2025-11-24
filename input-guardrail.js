import "dotenv/config";
import { Agent, InputGuardrailTripwireTriggered, run } from "@openai/agents";
import { z } from "zod";

const businessInputAgent = new Agent({
    name: "Business query checker",
    instructions: `You are an input guardrail agent that checks if the user query is business related query or not
    Rules:
        - The query has to be strictly a business related query only.
        - Reject any other kind of request even if related to business.
    `,
    model: "gpt-4o-mini",
    outputType: z.object({
        isValidBusinessQuery: z
            .boolean()
            .describe("if the query is business related query or not"),
        reason: z.string().optional().describe("reason to reject"),
    }),
});

const businessInputGuardrail = {
    name: "Business Queries Guardrail",
    execute: async ({ input }) => {
        const result = await run(businessInputAgent, input);
        return {
            tripwireTriggered: !result.finalOutput.isValidBusinessQuery,
            outputInfo: result.finalOutput.reason,
        };
    },
};

const buinessAgent = new Agent({
    name: "Law Agent",
    instructions: `You are an expert business ai agent`,
    inputGuardrails: [businessInputGuardrail],
});

async function main(query = "") {
    try {
        const result = await run(buinessAgent, query);
        console.log(`Result`, result.finalOutput);
    } catch (e) {
        if (e instanceof InputGuardrailTripwireTriggered) {
            console.log(`Invalid Input: Request rejected because ${e.message}`);
        }
    }
}

main("What is the role of stakeholders in a business?");
