import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { exec } from 'child_process';

// Create an MCP server
const server = new McpServer({
  name: 'Demo',
  version: '1.0.0',
});

// listFiles
server.tool('listFiles', '列出指定目录下的文件', { path: z.string() }, async ({ path }) => {
  return new Promise((resolve, _reject) => {
    exec(`ls -la ${path}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`执行命令出错: ${error}`);
        resolve({
          content: [{ type: 'text', text: `执行命令出错: ${error}` }],
        });
        return;
      }
      if (stderr) {
        console.error(`命令stderr: ${stderr}`);
      }
      resolve({
        content: [{ type: 'text', text: `已获取到目录 ${path} 文件列表:\n\`\`\`\n${stdout}\`\`\`\n` }],
      });
    })
  });
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.log('Server started');