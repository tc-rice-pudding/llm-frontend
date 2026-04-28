import * as dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import { exec } from 'child_process';

import { LLM } from './lib/llm';

interface IChatMessage {
  role: string;
  content: string;
  name?: string;
}

dotenv.config({
  path: ['.env.local', '.env']
});

const app = express();
const PORT = 3300;

const llm = new LLM(
  process.env.OLLAMA_MODEL || 'qwen3:1.7b',
  process.env.OLLAMA_API || 'http://localhost:11434'
);

app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body

  const messages:IChatMessage[]  = [
    {
      role: 'system',
      content: '如有需要，你可以调用listFiles工具查找指定目录下的文件和文件夹',
    },
    {
      role: 'user',
      content: message,
    },
  ];

  const reply = await llm.chat(messages);
  res.json({
    reply
  });
});

app.post('/chat-stream', async (req, res) => {
  const { message } = req.body

  const messages:IChatMessage[]  = [
    {
      role: 'system',
      content: '如有需要，你可以调用listFiles工具查找指定目录下的文件和文件夹',
    },
    {
      role: 'user',
      content: message,
    },
  ];

  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const emitter = await llm.chatStream(messages);
  emitter.on('data', (chunk) => {
    res.write(`event: message\ndata: ${JSON.stringify({content: chunk})}\n\n`);
  });
  emitter.on('tool_call', (chunk) => {
    res.write(`event: tool_call\ndata: ${JSON.stringify({tool: chunk})}\n\n`);
  });
  emitter.on('end', () => {
    res.write('event: done\ndata: {}\n\n');
    res.end();
  });
  emitter.on('error', (err: Error) => {
    console.error('流错误:', err);
    res.write(`event: error\ndata: ${JSON.stringify({error: err.message})}\n\n`);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
});