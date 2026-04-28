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

app.post('/chat-stream', async (req, res) => {
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

  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 创建一个流式请求
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
      stream: true, // 启用流式响应
    }, {
      responseType: 'stream'
    });

    let hasToolcall = false;
    // 处理流式响应
    response.data.on('data', (chunk: Buffer) => {
      try {
        const text = chunk.toString();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          console.log(line);
            
          try {
            const parsed = JSON.parse(line);
            
            // 检查是否有工具调用请求
            if (parsed.message?.tool_calls && 
                parsed.message.tool_calls.length > 0 && 
                parsed.message.tool_calls[0].function?.name === 'DirFiles') {

              hasToolcall = true;
              
              // 发送一个事件表示需要工具调用
              res.write(`event: tool_call\ndata: ${JSON.stringify({tool: 'DirFiles'})}\n\n`);
              
              // 执行ls命令获取当前目录文件列表
              exec('ls -la', async (error, stdout, stderr) => {
                if (error) {
                  console.error(`执行命令出错: ${error}`);
                  res.write(`event: error\ndata: ${JSON.stringify({error: error.message})}\n\n`);
                  res.end();
                  return;
                }
                
                if (stderr) {
                  console.error(`命令stderr: ${stderr}`);
                }
                
                // 将文件列表作为工具调用的输出
                messages.push({
                  role: 'tool',
                  name: 'DirFiles',
                  content: `当前目录文件列表:\n\`\`\`\n${stdout}\`\`\`\n`
                });
                
                // 发送工具调用结果
                res.write(`event: tool_result\ndata: ${JSON.stringify({result: stdout})}\n\n`);
                
                // 继续与模型对话
                const followUpResponse = await axios.post(`${base_url}/api/chat`, {
                  model,
                  messages,
                  stream: true,
                }, {
                  responseType: 'stream'
                });
                
                // 处理后续响应
                followUpResponse.data.on('data', (chunk: Buffer) => {
                  try {
                    const text = chunk.toString();
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    
                    for (const line of lines) {       
                      console.log(line);                 
                      try {
                        const parsed = JSON.parse(line);
                        if (parsed.message?.content) {
                          res.write(`event: message\ndata: ${JSON.stringify({content: parsed.message.content})}\n\n`);
                        }
                      } catch (e) {
                        console.error('解析JSON出错:', e);
                      }
                    }
                  } catch (e) {
                    console.error('处理流数据出错:', e);
                  }
                });
                
                followUpResponse.data.on('end', () => {
                  res.write('event: done\ndata: {}\n\n');
                  res.end();
                });
                
                followUpResponse.data.on('error', (err: Error) => {
                  console.error('流错误:', err);
                  res.write(`event: error\ndata: ${JSON.stringify({error: err.message})}\n\n`);
                  res.end();
                });
              });
              
              return; // 停止处理当前流，等待工具调用完成
            }
            
            // 正常消息内容
            if (parsed.message?.content) {
              res.write(`event: message\ndata: ${JSON.stringify({content: parsed.message.content})}\n\n`);
            }
          } catch (e) {
            console.error('解析JSON出错:', e);
          }
        }
      } catch (e) {
        console.error('处理流数据出错:', e);
      }
    });
    
    response.data.on('end', () => {
      // 检查是否因为工具调用而提前结束了处理
      // 如果没有工具调用，则在这里结束响应
      if (!hasToolcall) {
        res.write('event: done\ndata: {}\n\n');
        res.end();
      }
    });
    
    response.data.on('error', (err: Error) => {
      console.error('流错误:', err);
      res.write(`event: error\ndata: ${JSON.stringify({error: err.message})}\n\n`);
      res.end();
    });
    
  } catch (error: any) {
    console.error('Ollama API 错误:', error.message);
    res.write(`event: error\ndata: ${JSON.stringify({error: '无法连接 Ollama 模型'})}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
});