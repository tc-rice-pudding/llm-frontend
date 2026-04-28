import * as dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import { exec } from 'child_process';

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

app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body

  const model = process.env.OLLAMA_MODEL || 'qwen3:1.7b';
  const base_url = process.env.OLLAMA_API || 'http://localhost:11434';

  const messages:IChatMessage[]  = [
    {
      role: 'system',
      content: '如有需要，你可以调用DirFiles工具查找当前目录下的文件和文件夹',
    },
    {
      role: 'user',
      content: message,
    },
  ];

  try {
    const response = await axios.post(`${base_url}/api/chat`, {
      model,
      messages,
      tools: [{
        type: "function",
        function: {
          "name": "DirFiles",
          "description": "列出当前目录下的文件和文件夹",
        }
      }],
      stream: false, // 如果你想用流式响应，可以设为 true
    });

    const reply = response.data.message.content
    // console.log(response.data.message.tool_calls)
    
    // 检查是否有工具调用请求
    if (response.data.message.tool_calls && 
        response.data.message.tool_calls.length > 0 && 
        response.data.message.tool_calls[0].function?.name === 'DirFiles') {
      // 执行ls命令获取当前目录文件列表
      exec('ls -la', async (error, stdout, stderr) => {
        if (error) {
          console.error(`执行命令出错: ${error}`);
          res.json({ reply: `${reply}\n\n执行命令出错: ${error.message}` });
          return;
        }
        if (stderr) {
          console.error(`命令stderr: ${stderr}`);
        }
        // 返回文件列表和AI的回复
        // res.json({ reply: `${reply}\n\n当前目录文件列表:\n\`\`\`\n${stdout}\`\`\`` });

        // 调用API，将文件列表作为工具调用的输出
        messages.push({
          role: 'tool',
          name: 'DirFiles',
          content: `当前目录文件列表:\n\`\`\`\n${stdout}\`\`\`\n`
        });
        const response = await axios.post(`${base_url}/api/chat`, {
          model,
          messages,
          stream: false, 
        });
        res.json({ reply: response.data.message.content });
      });
    } else {
      res.json({ reply })
    }
  } catch (error: any) {
    console.error('Ollama API 错误:', error.message)
    res.status(500).json({ error: '无法连接 Ollama 模型' })
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
});