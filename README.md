## OpenAI Agent SDK – JavaScript & TypeScript Learning Playground

This repository is a **hands-on learning and documentation playground** for the **OpenAI Agent SDK** (`@openai/agents`) using **JavaScript** and **TypeScript**.

Each file in this project focuses on a specific Agent SDK concept:

-   **Basic agents & instructions**
-   **Tools & tool schemas (`tool`)**
-   **Conversation history & threads**
-   **Input and output guardrails**
-   **Agent handoff & orchestration**
-   **Typed run context (TypeScript)**
-   **Structured outputs with `zod`**
-   **Streaming responses**

If you are exploring how to build production-grade agents with OpenAI’s SDK, this repo gives you **small, focused examples** you can run and modify.

---

## 1. Prerequisites

-   **Node.js** 18+ recommended
-   **npm** (bundled with Node)
-   An **OpenAI API key** with access to the Agents API

Set your API key and (optionally) project in a `.env` file:

```bash
OPENAI_API_KEY=sk-...
OPENAI_PROJECT=proj_...
```

The examples rely on:

-   `@openai/agents` – the Agent SDK
-   `openai` – the core REST client (used for conversations)
-   `zod` – schema validation and structured outputs
-   `dotenv` – loading environment variables
-   `axios` – HTTP client (for tool example)

Install dependencies:

```bash
npm install
```

---

## 2. Project Structure

Key files and what they demonstrate:

-   **`index.js`** – Dynamic instructions & basic `Agent` + `run` usage
-   **`agent-tool.js`** – Tools, multi-agent workflows, and `asTool`
-   **`conversation.js`** – Conversation history stored in memory (`history`)
-   **`server-conversation.js`** – Server-side conversations using `conversationId`
-   **`create-conversation.js`** – Creating conversations via the `openai` REST client
-   **`input-guardrail.js`** – Input guardrails using a dedicated classifier agent
-   **`output-guardrail.js`** – Output guardrails for SQL safety
-   **`agent-handoff.js`** – Handoffs between specialized agents
-   **`agent-manager.js`** – Conditional instructions and simple agent manager pattern
-   **`run-context.ts`** – Type-safe `RunContext` and agent context in TypeScript
-   **`streaming.ts`** – Streaming agent responses with `stream: true` and `toTextStream()`
-   **`human-loop.ts`** – Human-in-the-loop approvals for sensitive tools
-   **`hosted-agent.ts`** – Using a hosted MCP server as a tool
-   **`streamable-agent.ts`** – Using `MCPServerStreamableHttp` with an MCP server

You can open each file to study it, then run it directly with Node (for `.js`) or `tsx`/`ts-node` (for `.ts`).

---

## 3. Basic Agent & Dynamic Instructions (`index.js`)

File: `index.js`

Concepts:

-   Creating a simple `Agent`
-   Using **dynamic instructions** (function-based instructions)
-   Calling `run(agent, input)` and accessing `result.finalOutput`

Key points:

-   `Agent` is configured with:
    -   `name`: descriptive agent name
    -   `instructions`: a **function** that can compute different prompts depending on some external state (e.g., user’s preferred LLM)
    -   `model`: selected OpenAI model (e.g., `gpt-4.1`)
-   `run(agent, input)` executes the agent and returns:
    -   `finalOutput`: the final response text or structured data
    -   `history`: the underlying message history (where applicable)

Run:

```bash
node index.js
```

---

## 4. Tools & Multi-Agent Workflows (`agent-tool.js`)

File: `agent-tool.js`

Concepts:

-   Defining tools with `tool({...})`
-   Using **Zod schemas** for tool parameters
-   Composing agents and exposing one agent as a **tool** for another agent with `asTool`

What this example does:

-   `fetchUserOrdersTool`:
    -   Simulates fetching a list of user orders (e.g., from an e-commerce system).
    -   Uses a `z.object({...})` Zod schema to specify the tool’s input shape.
-   `cancelOrdersTool`:
    -   Represents a side-effect tool that logs or persists cancellations (e.g., via `fs.appendFile`).
-   `cancelOrdersAgent`:
    -   A dedicated operations agent responsible only for user order cancellations.
    -   Exposed as a tool to other agents using `cancelOrdersAgent.asTool({ ... })`.
-   `salesAgent`:
    -   A higher-level agent responsible for user-facing conversations.
    -   Uses both:
        -   Direct tools (`fetchUserOrdersTool`)
        -   Another agent (`cancelOrdersAgent`) **as a tool**.

Run:

```bash
node agent-tool.js
```

This pattern is useful when you want a **specialized sub-agent** (e.g., cancellations) to be invoked only when needed by a more general agent.

---

## 5. Conversation State & Memory

### 5.1 In-Memory Conversation History (`conversation.js`)

File: `conversation.js`

Concepts:

-   Using an array as **shared conversation history**
-   Passing a full `history` array to `run(agent, history)`
-   Reading and updating `result.history`

What this example does:

-   Declares a global `sharedHistory` array.
-   Defines a `sqlAgent` that:
    -   Understands a sample PostgreSQL schema.
    -   Is specialized in generating SQL queries.
-   The `main()` function:
    -   Pushes the new user message into `sharedHistory`.
    -   Calls `run(sqlAgent, sharedHistory)`.
    -   Updates `sharedHistory` with `result.history`.
    -   Logs `result.finalOutput`.

This is a simple pattern to **simulate a chat session** within a single process.

Run:

```bash
node conversation.js
```

### 5.2 Server-Side Conversations (`server-conversation.js`)

File: `server-conversation.js`

Concepts:

-   Persistent conversation threads managed by OpenAI’s platform
-   Using `conversationId` instead of in-memory history

What this example does:

-   Creates the same type of `sqlAgent` as above.
-   Calls `run(sqlAgent, query, { conversationId })` where `conversationId` is a fixed id from the platform.
-   The server (OpenAI) keeps track of the **full thread** associated with that `conversationId`.

Run:

```bash
node server-conversation.js
```

### 5.3 Creating Conversations via REST Client (`create-conversation.js`)

File: `create-conversation.js`

Concepts:

-   Using the **`openai`** client (`OpenAI`) directly
-   Creating a conversation thread via `client.conversations.create`

What this example does:

-   Instantiates `const client = new OpenAI()`.
-   Calls `client.conversations.create({})`.
-   Logs `e.id` (the new conversation id), which you can then plug into `conversationId` for agent runs.

Run:

```bash
node create-conversation.js
```

---

## 6. Guardrails

### 6.1 Input Guardrails (`input-guardrail.js`)

File: `input-guardrail.js`

Concepts:

-   **Input guardrails** to validate user requests before the main agent runs
-   `InputGuardrailTripwireTriggered` error handling
-   Using a **dedicated guardrail agent** to classify requests

What this example does:

-   `businessInputAgent`:
    -   A classifier-style agent that checks if the input is strictly a **business-related query**.
    -   Outputs `{ isValidBusinessQuery, reason? }` using a Zod schema.
-   `businessInputGuardrail`:
    -   Wraps the classifier agent.
    -   Returns `tripwireTriggered` and `outputInfo` for the main agent.
-   `businessAgent`:
    -   The main agent that only proceeds if the input passes the guardrail.
    -   Uses `inputGuardrails: [businessInputGuardrail]`.
-   `main()`:
    -   Calls `run(businessAgent, query)`.
    -   If the input is invalid, `InputGuardrailTripwireTriggered` is thrown and caught, displaying the rejection reason.

Run:

```bash
node input-guardrail.js
```

### 6.2 Output Guardrails (`output-guardrail.js`)

File: `output-guardrail.js`

Concepts:

-   **Output guardrails** that validate an agent’s output before it is used
-   SQL safety checks (read-only vs destructive operations)

What this example does:

-   `sqlOutputGuardrail`:
    -   A dedicated agent that receives a SQL query and decides whether it’s safe.
    -   Output schema: `{ isSafe: boolean, reason?: string }`.
-   `sqlGuardrail`:
    -   A guardrail object that runs the guardrail agent on `agentOutput.sqlQuery`.
    -   Sets `tripwireTriggered` if the query is unsafe.
-   `sqlAgent`:
    -   A SQL-generating agent that:
        -   Knows the same PostgreSQL schema as other examples.
        -   Has `outputType` specifying it returns `{ sqlQuery?: string }`.
        -   Uses `outputGuardrails: [sqlGuardrail]`.
-   `main()`:
    -   Calls `run(sqlAgent, query)`.
    -   Logs `result.finalOutput.sqlQuery` if safe, or trips the guardrail otherwise.

Run:

```bash
node output-guardrail.js
```

This pattern is ideal when you want a generative agent to propose actions (like SQL) but require a **second opinion** before executing.

---

## 7. Agent Handoff & Orchestration (`agent-handoff.js`)

File: `agent-handoff.js`

Concepts:

-   **Handoffs** between agents
-   A “front-door” agent that routes to specialized sub-agents
-   Using `RECOMMENDED_PROMPT_PREFIX` for robust system prompts

What this example does:

-   `cancelOrdersTool` and `fetchUserOrdersTool`:
    -   Tools similar to the ones in `agent-tool.js`, for order cancellation and retrieval.
-   `cancelOrdersAgent`:
    -   Specializes in cancelling user orders.
    -   Exposes `cancelOrdersTool`.
-   `salesAgent`:
    -   Specializes in general sales and product help.
    -   Can use tools like `fetchUserOrdersTool` and `cancelOrdersAgent` as a tool.
-   `customerSupportAgent`:
    -   The **top-level agent** that interacts with the user first.
    -   Instructions incorporate `RECOMMENDED_PROMPT_PREFIX`.
    -   Uses `handoffs: [salesAgent, cancelOrdersAgent]` to delegate to the appropriate expert.

Run:

```bash
node agent-handoff.js
```

This is a blueprint for building **multi-agent systems** (e.g., front-line support that can hand off to billing, sales, or technical specialists).

---

## 8. Type-Safe Run Context in TypeScript (`run-context.ts`)

File: `run-context.ts`

Concepts:

-   Using TypeScript with the Agent SDK
-   Type-safe `RunContext` and custom context payloads
-   Agents with generic context types

What this example does:

-   Defines a `MyContext` interface with `userId` and `userName`.
-   Implements a `getUserInfoTool` that:
    -   Accepts a `RunContext<MyContext>` as its second parameter.
    -   Reads `ctx?.context.userId` and `ctx?.context.userName`.
-   Creates a `customerSupportAgent` typed as `Agent<MyContext>`.
-   `main(query, ctx)`:
    -   Calls `run(customerSupportAgent, query, { context: ctx })`.
    -   Logs `result.finalOutput`.

Run (with `tsx` or `ts-node`):

```bash
npx tsx run-context.ts
```

This pattern is useful when your agent needs **per-request contextual information** (e.g., authenticated user, tenant id, preferences).

---

## 9. Streaming Responses (`streaming.ts`)

File: `streaming.ts`

Concepts:

-   Streaming an agent’s response with `{ stream: true }`
-   Consuming a stream via `toTextStream()` and `for await`

What this example does:

-   Creates a `Storyteller Agent` with simple narrative instructions.
-   Defines `async function* streamOutput(query: string)` that:
    -   Calls `run(agent, query, { stream: true })`.
    -   Converts the result into a text stream via `result.toTextStream()`.
    -   Yields each chunk as `{ isCompleted: false, value: chunk }`.
    -   Yields a final `{ isCompleted: true, value: result.finalOutput }`.
-   `main(query)` consumes `streamOutput(query)` and logs each yielded object.

Run:

```bash
npx tsx streaming.ts
```

Streaming is ideal when you want **responsive UIs** or CLIs that show partial results as the model generates them.

---

## 10. Human-in-the-Loop Tool Approvals (`human-loop.ts`)

File: `human-loop.ts`

Concepts:

-   **Human approval** for sensitive tools with `needsApproval: true`
-   Handling `result.interruptions` and resuming runs from state
-   Using a CLI prompt loop to approve or reject tool calls

What this example does:

-   `getNewsTool`:
    -   Fetches news from an external RSS endpoint using `axios`.
    -   Uses a Zod schema to accept a `country` string.
-   `sendEmailTool`:
    -   Sends an email via an external email provider API.
    -   Marked with `needsApproval: true`, so the agent must request approval before executing.
-   `agent`:
    -   Combines both tools to fetch top headlines and email them.
-   `askForUserConfirmation()`:
    -   A small utility using `readline` to ask the user `(y/n)` questions in the terminal.
-   `main(query)`:
    -   Calls `run(agent, query)` and inspects `result.interruptions`.
    -   When it sees a `tool_approval_item` interruption, it:
        -   Asks the user to approve/reject the specific tool call and arguments.
        -   Calls `currentState.approve(interrupt)` or `currentState.reject(interrupt)`.
        -   Resumes the run by calling `run(agent, currentState)` until there are no more interruptions.

Run (with `tsx` or `ts-node`):

```bash
npx tsx human-loop.ts
```

This is a template for integrating **human review** into sensitive operations such as emails, payments, or destructive actions.

---

## 11. Hosted MCP Tool (`hosted-agent.ts`)

File: `hosted-agent.ts`

Concepts:

-   Using **hosted MCP tools** with `hostedMcpTool`
-   Treating an MCP server as a tool provider

What this example does:

-   Creates an `Agent` with:
    -   `name: "MCP Assistant"`
    -   Instructions that say the agent **must** use MCP tools.
    -   `tools` containing a single `hostedMcpTool({...})`:
        -   `serverLabel`: logical label for the server (e.g., `gitmcp`)
        -   `serverUrl`: the hosted MCP URL (`https://gitmcp.io/openai/codex`)
-   `main(q)`:
    -   Calls `run(agent, q)`.
    -   Prints `result.finalOutput`, which should be grounded in the MCP server’s capabilities and data.

Run:

```bash
npx tsx hosted-agent.ts
```

Use this pattern when you want to rely on **remote MCP servers** as standardized tool providers without managing them yourself.

---

## 12. Streamable MCP Agent (`streamable-agent.ts`)

File: `streamable-agent.ts`

Concepts:

-   Connecting to an MCP server using `MCPServerStreamableHttp`
-   Managing server lifecycle (`connect` / `close`)
-   Using MCP servers via the `mcpServers` field on `Agent`

What this example does:

-   Creates an `MCPServerStreamableHttp` instance:
    -   `url`: `https://gitmcp.io/openai/codex`
    -   `name`: `"GitMCP Documentation Server"`
-   Configures an `Agent`:
    -   With instructions to always use MCP tools.
    -   With `mcpServers: [githubMcpServer]`.
-   `main(q)`:
    -   Calls `githubMcpServer.connect()` before running the agent.
    -   Calls `run(agent, q)` and logs `result.finalOutput`.
    -   Ensures `githubMcpServer.close()` is called in a `finally` block.

Run:

```bash
npx tsx streamable-agent.ts
```

This shows how to **explicitly manage the lifecycle** of an MCP server connection while still using the Agent SDK.

---

## 13. Models & Configuration

In these examples, agents use models like:

-   `gpt-4o-mini`
-   `gpt-4.1`

You can change the model per agent:

```js
const myAgent = new Agent({
    name: "My Agent",
    instructions: "You are a helpful assistant.",
    model: "gpt-4.1-mini", // or any supported model
});
```

If you omit `model`, the SDK may use a default depending on your configuration. For consistent results, **explicitly set the model**.

---

## 14. Running & Experimenting

-   Make sure you have your `.env` with `OPENAI_API_KEY` (and optionally `OPENAI_PROJECT`).
-   Pick an example file and run it:

```bash
node input-guardrail.js
node output-guardrail.js
node agent-handoff.js
node conversation.js
node server-conversation.js
node create-conversation.js
npx tsx run-context.ts
npx tsx streaming.ts
```

Feel free to:

-   Modify prompts and instructions.
-   Add new tools and agents.
-   Try different models.
-   Plug in your own APIs instead of mock data.

This repo is meant to be **exploratory**—change things, break them, and learn how the OpenAI Agent SDK fits your real-world use cases.

---

## 15. License

This project is licensed under the **ISC License** (see `package.json`). You are free to copy, modify, and adapt these examples for your own projects.
