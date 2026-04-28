import * as dotenv from 'dotenv'
import express from 'express';
import { pipeline } from 'node:stream/promises';
import { type ChatConfig, Ling } from '@bearbobo/ling';
import makeQuestionPrompt from './lib/prompts/make-question.tpl.ts';
import quickAnswerPrompt from './lib/prompts/quick-answer.tpl.ts';
import outlinePrompt from './lib/prompts/outline.tpl.ts';
import bodyParser from 'body-parser';
import { search } from './lib/service/serper.search.ts';
import { generateImage } from './lib/service/generate-image.ts';

dotenv.config({
    path: ['.env.local', '.env']
})

const apiKey = process.env.VITE_KIMI_API_KEY as string;
const endpoint = process.env.VITE_KIMI_END_POINT as string;
const modelName = process.env.VITE_KIMI_MODEL_NAME as string;

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());

const config: ChatConfig = {
    model_name: modelName,
    api_key: apiKey,
    endpoint,
    sse: true,
};

app.get('/generate', async (req, res) => {
    const userConfig = {
        gender: 'female',
        age: '6',
    };
    const question = req.query.question as string;
    const query = req.query.query as string;
    let searchResults = '';
    if (query) {
        const queries = query.split(';');
        const promises = queries.map((query) => search(query));

        searchResults = JSON.stringify(await Promise.all(promises));
    }
    // ------- The work flow start --------
    const ling = new Ling(config);
    const quickAnswerBot = ling.createBot('quick-answer', {}, {
        response_format: { type: 'text' }
    });
    quickAnswerBot.addPrompt(quickAnswerPrompt, userConfig);

    const outlineBot = ling.createBot('outline');
    outlineBot.addPrompt(outlinePrompt, userConfig);

    outlineBot.addFilter('image_prompt');
    outlineBot.addListener('string-response', ({ uri, delta }) => {
        ling.handleTask(async () => {
            if (uri.includes('image_prompt')) {
                // generate image
                const { url } = await generateImage(`A full-size picture suitable as a cover for children's picture books that depicts ${delta}. DO NOT use any text or symbols.`);
                ling.sendEvent({ uri: 'cover_image', delta: url });
            }
        });
    });

    if (searchResults) {
        quickAnswerBot.addPrompt(`参考资料:\n${searchResults}`);
        outlineBot.addPrompt(`参考资料:\n${searchResults}`);
    }

    quickAnswerBot.chat(question);
    outlineBot.chat(question);

    ling.close();

    // setting below headers for Streaming the data
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });

    pipeline((ling.stream as any), res);
});

app.get('/make-question', async (req, res) => {
    const question = req.query.question as string;

    // ------- The work flow start --------
    const ling = new Ling(config);
    const bot = ling.createBot();
    bot.addPrompt(makeQuestionPrompt);
    bot.chat(question);

    ling.close();

    // setting below headers for Streaming the data
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });

    pipeline((ling.stream as any), res);
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});