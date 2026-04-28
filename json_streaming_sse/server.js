import * as dotenv from 'dotenv'
import express from 'express';
import { JSONParser } from './lib/json-parser.ts';
import { generateAudio } from './lib/audio.js';

dotenv.config({
    path: ['.env.local', '.env']
})

const openaiApiKey = process.env.VITE_API_KEY;
const endpoint = process.env.VITE_END_POINT;

const app = express();
const port = 3000;

const systemPrompt = `
你是一位亲子英语启蒙老师，负责设计家庭英语亲子英语例句。
根据用户输入的主题，生成不少于10句英文例句。

输出以下JSON格式内容：
{
  "example_sentences": [
    {
      "english": "example sentence",
      "chinese": "例句的中文翻译"
    },
    ...
  ]
}
`;

// SSE 端点
app.get('/stream', async (req, res) => {
    // 设置响应头部
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // 发送初始响应头

    try {
        // 发送 OpenAI 请求
        const response = await fetch(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k', // 选择你使用的模型
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: req.query.question }
                    ],
                    response_format: { type: "json_object" },
                    stream: true, // 开启流式响应
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from OpenAI');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const jsonParser = new JSONParser({
            autoFix: true,
            onError: (error) => {
                console.error('JSON Parser Error:', error);
            }
        });

        const audioPromises = [];

        jsonParser.on('data', (data) => {
            if (data.uri) res.write(`data: ${JSON.stringify(data)}\n\n`); // 发送数据到客户端
        });
        jsonParser.on('string-resolve', ({ uri, delta }) => {
            if (uri.includes('english')) {
                const task = generateAudio(delta);
                audioPromises.push(task);
                task.then((base64data) => {
                    const audioUri = uri.replace('english', 'audio');
                    res.write(`data: ${JSON.stringify({ uri: audioUri, delta: base64data })}\n\n`)
                });
            }
        });

        let done = false;

        let buffer = '';

        // 读取流数据并转发到客户端
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = buffer + decoder.decode(value, { stream: true });
            buffer = '';

            // 按行分割数据，每行以 "data: " 开头，并传递给客户端
            const lines = chunkValue.split('\n').filter(line => line.trim() && line.startsWith('data: '));
            for (const line of lines) {
                const incoming = line.slice(6);
                if (incoming === '[DONE]') {
                    done = true;
                    break;
                }
                try {
                    const data = JSON.parse(incoming);
                    const delta = data.choices[0].delta.content;
                    jsonParser.trace(delta);
                    // if (delta) res.write(`data: ${delta}\n\n`); // 发送数据到客户端
                } catch (ex) {
                    buffer += `data: ${incoming}`;
                }
            }
        }

        await Promise.all(audioPromises); // 等待音频数据结束

        res.write('event: end\n'); // 发送结束事件
        res.write('data: [DONE]\n\n'); // 通知客户端数据流结束
        res.end(); // 关闭连接

    } catch (error) {
        console.error('Error fetching from OpenAI:', error);
        res.write('data: Error fetching from OpenAI\n\n');
        res.end();
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
