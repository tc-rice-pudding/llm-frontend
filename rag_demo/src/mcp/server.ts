#!/usr/bin/env node

/*
 * MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadPrompt } from './utils';
import { SimpleRag } from '../index';
import fs from 'fs/promises';
import path from 'path';

// Create an MCP server
const server = new McpServer({
  name: 'AskYourLib',
  version: '1.0.0',
});

// Global SimpleRag instance
let simpleRagInstance: SimpleRag | null = null;

server.tool(
  'ask-your-lib-initialize',
  `Initialize the vector database operations and clean up any existing .vectra directory.`,
  {
    indexPath: z.string().describe('The path to the vector database index. If not specified by the user, defaults to the .vectra subdirectory under the current project directory.'),
  },
  async ({ indexPath }) => {
    try {
      // Check if .vectra directory exists in project root and remove it
      const projectRoot = path.resolve(__dirname, '../../');
      const vectraPath = path.join(projectRoot, '.vectra');
      const generateMcpPrompt = await loadPrompt('generate');
      
      try {
        await fs.access(vectraPath);
        await fs.rm(vectraPath, { recursive: true, force: true });
        console.log('Removed existing .vectra directory');
      } catch (error) {
        // Directory doesn't exist, which is fine
        console.log('.vectra directory does not exist, skipping removal');
      }
      
      // Create new SimpleRag instance
      simpleRagInstance = new SimpleRag(indexPath);
      
      return {
        content: [{ 
          type: 'text', 
          text: `⚠️ The guide to follow: \n${generateMcpPrompt}\n\n`
        }],
      };
    } catch (error) {
      console.error(`Error initializing SimpleRag: ${error}`);
      return {
        content: [{ 
          type: 'text', 
          text: `Error initializing SimpleRag: ${error}` 
        }],
      };
    }
  }
)

server.tool(
  'ask-your-lib-insert',
  `Insert and vectorize text content into the vector database.`,
  {
    text: z.string(),
  },
  async ({ text }) => {
    try {
      if (!simpleRagInstance) {
        return {
          content: [{ 
            type: 'text', 
            text: 'Database instance is not initialized. Please call ask-your-lib-initialize first.' 
          }],
        };
      }
      
      if (!simpleRagInstance.avaliable) {
        await simpleRagInstance.initialize();
      }
      
      const result = await simpleRagInstance.add(text);
      
      return {
        content: [{ 
          type: 'text', 
          text: `Text inserted successfully. Inserted items: ${JSON.stringify(result)}` 
        }],
      };
    } catch (error) {
      console.error(`Error inserting text: ${error}`);
      return {
        content: [{ 
          type: 'text', 
          text: `Error inserting text: ${error}` 
        }],
      };
    }
  }
)

async function main() {
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Server started');
}
main();