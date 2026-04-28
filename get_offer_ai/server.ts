import * as dotenv from 'dotenv';
import express from 'express';
import { type ChatConfig, Ling } from "@bearbobo/ling";
import { pipeline } from 'node:stream/promises';
import bodyParser from 'body-parser';
import { createEventChannel, getEventChannel } from './lib/service/eventChannel';
import { getContext } from './lib/config/context.config';
import { getInterviewMemory, updateInterviewMemory } from './lib/service/memory';
import memoryPrompt from './lib/prompt/memory.prompt';

dotenv.config({
    path: ['.env.local', '.env']
});

const apiKey: string = process.env.VITE_DEEPSEEK_API_KEY as string;
const endpoint: string = process.env.VITE_DEEPSEEK_ENDPOINT as string;
const modelName: string = process.env.VITE_DEEPSEEK_MODEL_NAME as string;

const app = express();
const port: number = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const historyMap: Record<string, Array<{role: any, content: string}>> = {};

app.post('/chat', async (req, res) => {
    const { message, sessionId, timeline } = req.body;

    const config = {
        model_name: modelName,
        api_key: apiKey,
        endpoint: endpoint,
        sse: true,
    };

    historyMap[sessionId] = historyMap[sessionId] || [];
    const histories = historyMap[sessionId];
    histories.push({role: 'user', content: message});

    const context = getContext(timeline);
    const memory = getInterviewMemory(sessionId);


    const memoryStr = `# memory

${JSON.stringify(memory)}
`;

    // ------- The work flow start --------
    const ling = new Ling(config, {
        max_tokens: 8192,
    });
    const bot = ling.createBot('reply', {}, {
        response_format: { type: "text" },
    });

    console.log('context', context);
    bot.addPrompt(context);
    bot.addPrompt(memoryStr);

    bot.addHistory(histories.slice(-3))

    // 对话同时更新记忆
    const memoryBot = ling.createBot('memory', {}, {
        quiet: true,
    });

    memoryBot.addListener('inference-done', (content) => {
        const memory = JSON.parse(content);
        console.log('memory', memory);
        updateInterviewMemory(sessionId, memory);
    });

    memoryBot.addPrompt(memoryPrompt, { memory: memoryStr });

    memoryBot.chat(`# 历史对话内容

## 提问
${histories[histories.length - 2]?.content || ''}

## 回答
${histories[histories.length - 1]?.content || ''}

请更新记忆`);

    bot.chat(message);

    bot.addListener('inference-done', (content) => {
        histories.push({role: 'assistant', content});
    });

    bot.addListener('response', () => {
        ling.sendEvent({event: 'response-finished'});
    });

    ling.close();

    res.send(createEventChannel(ling));
});

app.get('/event',  (req, res) => {
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    const eventChannel = getEventChannel(req.query.channel as string);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const { stream, controller } = eventChannel.getStream(lastEventId);
    try {
        pipeline(stream as any, res);
    } catch (ex) {
        console.log(ex);
        controller?.close();
    }
});

app.get('/voice-token', async (req, res) => {
    const region = process.env.VITE_AZURE_SPEECH_REGION;
    const key = process.env.VITE_AZURE_SPEECH_KEY;

    const headers: any = {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/x-www-form-urlencoded',
    }; 

    const token = await (
        await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
            method: 'POST',
            headers,
        })
    ).text();

    res.send({
        data: {
            token: token,
            region: region,
        }
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});