import { config } from "dotenv";
config();
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import { createPost } from "./mcp.tool.js";

import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

// Map to store transports by session ID

const app = express();

server.tool(
  "addTwoNumber",
  "This is tool which is use to add two number",
  {
    a: z.number().describe("It will first number"),
    b: z.number().describe("this will be second number"),
  },
  async (arg) => {
    const { a, b } = arg;

    return {
      content: [
        {
          type: "text",
          text: `The sum of ${a} and ${b} is ${a + b}`,
        },
      ],
    };
  }
);

server.tool(
  "creatPost",
  "Creates a post for X (formerly Twitter). The post should be engaging and include 2-3 relevant hashtags based on the content.",
  {
    status: z.string().describe("The text content of the post."),
    // Add an optional parameter for the image
    imagePath: z
      .string()
      .optional()
      .describe("An optional local file path to an image to attach."),
  },
  async (arg) => {
    // Pass both arguments to the createPost function
    const { status, imagePath } = arg;
    return createPost(status, imagePath);
  }
);
const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
