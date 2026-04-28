import * as dotenv from 'dotenv'
import express from 'express';
import { pipeline } from 'node:stream/promises';
import { generateAudio } from './lib/audio.ts';
import { type ChatConfig, Ling } from '@bearbobo/ling';
import userPrompt from './lib/prompt.tpl.ts';
import bodyParser from 'body-parser';

dotenv.config({
    path: ['.env.local', '.env']
})

const apiKey = process.env.VITE_KIMI_API_KEY as string;
const endpoint = process.env.VITE_KIMI_END_POINT as string;
const modelName = process.env.VITE_KIMI_MODEL_NAME as string;

const app = express();
const port = 3000;

const audioBuffers: Record<string, Buffer> = {};

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

// SSE 端点
app.post('/vision', async (req, res) => {
    // 设置响应头部
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // 发送初始响应头

    const imageData = req.body.imageData as string;

    const config: ChatConfig = {
        model_name: modelName,
        api_key: apiKey,
        endpoint,
    };

    // ------- The work flow start --------
    const ling = new Ling(config);
    const bot = ling.createBot();
    bot.addPrompt(userPrompt);
    bot.chat([{
        type: "image_url",
        image_url: {
            "url": imageData,
        },
    }, {
        type: "text",
        text: userPrompt,
    }]);

    bot.on('string-response', ({ uri, delta }) => {
        // Infer the content of the string in the JSON, and send the content of the 'answer' field to the second bot.
        console.log('bot string-response', uri, delta);
        if (uri.endsWith('example_sentence')) {
            ling.handleTask(async () => {
                const audioData = await generateAudio(delta);
                // console.log(audioData);
                const tmpId = Math.random().toString(36).substring(7);
                audioBuffers[tmpId] = Buffer.from(audioData, 'base64');
                ling.sendEvent({ uri: 'example_sentence_audio', delta: `/api/audio?id=${tmpId}` });
            });
        }
    });

    ling.close();

    pipeline((ling.stream as any), res);
});

app.get('/audio', (req, res) => {
    const id = req.query.id as string;
    const audioData = audioBuffers[id];
    if (!audioData) {
        res.status(404).send('Audio not found');
        return;
    }
    res.setHeader('Content-Type', 'audio/ogg');
    res.send(audioData);
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});