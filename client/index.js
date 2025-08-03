import { config } from "dotenv";
import readline from "readline/promises";

import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { type } from "os";

config();

let tools = [];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const mcpclient = new Client({
  name: "example-client",
  version: "1.0.0",
});

const chatHistory = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

mcpclient
  .connect(new SSEClientTransport(new URL("http://localhost:3001/sse")))
  .then(async () => {
    console.log("connect to mcp server");
    tools = (await mcpclient.listTools()).tools.map((tool) => {
      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: tool.inputSchema.type,
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      };
    });
    chatloop();
  });

async function chatloop(toolcall) {
  if (toolcall) {
    chatHistory.push({
      role: "model",
      parts: [
        {
          text: `calling tool ${toolcall.name}`,
          type: "text",
        },
      ],
    });
    const toolResult = await mcpclient.callTool({
      name: toolcall.name,
      arguments: toolcall.args,
    });

    chatHistory.push({
      role: "user",
      parts: [
        {
          text: "Tools result: " + toolResult.content[0].text,
          type: "text",
        },
      ],
    });
    console.log(`console.log ${toolResult}`);
  } else {
    const question = await rl.question("You: ");

    chatHistory.push({
      role: "user",
      parts: [
        {
          text: question,
          type: "text",
        },
      ],
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: chatHistory,
    config: {
      tools: [
        {
          functionDeclarations: tools,
        },
      ],
    },
  });

  //console.log(response.candidates[0].content.parts[0].text);
  const functionCall = response.candidates[0].content.parts[0].functionCall;
  const responseText = response.candidates[0].content.parts[0].text;

  if (functionCall) {
    return chatloop(functionCall);
  }
  chatHistory.push({
    role: "model",
    parts: [{ text: responseText, type: "text" }],
  });

  console.log(`AI: ${responseText}`);
  chatloop();
}
