import * as dotenv from 'dotenv'
import express from 'express';
import { Ling } from "@bearbobo/ling";
import { pipeline } from 'node:stream/promises';
import htmlPrompt from './lib/prompts/html-prompt.tpl.js';
import designPrompt from './lib/prompts/design-prompt.tpl.js';

dotenv.config({
    path: ['.env.local', '.env']
})

const apiKey = process.env.VITE_API_KEY;
const endpoint = process.env.VITE_END_POINT;

const app = express();
const port = 3000;

// SSE 端点
app.get('/stream', async (req, res) => {
    const config = {
        model_name: 'moonshot-v1-8k',
        api_key: apiKey,
        endpoint: endpoint,
        sse: true,
    };

    const resume = req.query.resume;

    // ------- The work flow start --------
    const ling = new Ling(config);
    const bot = ling.createBot(null, {
        max_tokens: 2048,
    }, {
        response_format: { type: 'html' }
    });

    bot.addPrompt(htmlPrompt);
    bot.addPrompt(designPrompt);
    bot.chat(resume);

    ling.close();

    // setting below headers for Streaming the data
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });

    pipeline(ling.stream, res);
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
