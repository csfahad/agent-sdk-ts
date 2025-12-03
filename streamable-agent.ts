import "dotenv/config";
import { Agent, run, MCPServerStreamableHttp } from "@openai/agents";

const githubMcpServer = new MCPServerStreamableHttp({
    url: "https://gitmcp.io/openai/codex",
    name: "GitMCP Documentation Server",
});

const agent = new Agent({
    name: "MCP Assistant",
    instructions: "You must always use the MCP tools to answer questions.",
    mcpServers: [githubMcpServer],
});

async function main(q: string) {
    try {
        await githubMcpServer.connect();
        const result = await run(agent, q);
        console.log(result.finalOutput);
    } catch (err) {
        console.error(err);
    } finally {
        await githubMcpServer.close();
    }
}

main("give me brief about this repo");
