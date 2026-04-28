import * as dotenv from 'dotenv'
import express from 'express';
import { pipeline } from 'node:stream/promises';
import { type ChatConfig, Ling } from '@bearbobo/ling';
import makeQuestionPrompt from './lib/prompts/make-question.tpl.ts';
import quickAnswerPrompt from './lib/prompts/quick-answer.tpl.ts';
import outlinePrompt from './lib/prompts/outline.tpl.ts';
import subTopicsPrompt from './lib/prompts/sub-topics.tpl.ts';
import articleTpl from './lib/prompts/article.tpl.ts';
import podcastTpl from './lib/prompts/podcast.tpl.ts';
import bodyParser from 'body-parser';
import { search } from './lib/service/serper.search.ts';
import { generateImage } from './lib/service/generate-image.ts';
import { generateAudio } from './lib/service/audio.ts';

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
    const quickAnswerBot = ling.createBot('quick-answer', {
        max_tokens: 4096 * 4,
    }, {
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

    outlineBot.addListener('inference-done', (content) => {
        const outline = JSON.parse(content);
        delete outline.image_prompt;

        const bot = ling.createBot();
        bot.addPrompt(subTopicsPrompt, userConfig);
        bot.addFilter(/\/subtopics\//);

        bot.chat(JSON.stringify(outline));

        // 文章生成
        bot.addListener('inference-done', (content) => {
            const { topics } = JSON.parse(content);
            // console.log(topics);
            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];

                const bot = ling.createBot(`topics/${i}`);
                bot.addPrompt(articleTpl, userConfig);
                bot.addFilter({
                    article_paragraph: true,
                    image_prompt: true,
                });
                bot.addListener('string-response', ({ uri, delta }) => {
                    if (uri.endsWith('article_paragraph')) {
                        const podcastBot = ling.createBot('', undefined, {
                            quiet: true,
                            response_format: { type: 'text' }
                        });
                        podcastBot.addPrompt(podcastTpl, userConfig);
                        podcastBot.chat(delta);

                        podcastBot.addListener('inference-done', (content) => {
                            // console.log(content);
                            ling.handleTask(async () => {
                                const audioData = await generateAudio(content);
                                const tmpId = Math.random().toString(36).substring(7);
                                audioBuffers[tmpId] = Buffer.from(audioData, 'base64');
                                // console.log('create audio', `/api/audio?id=${tmpId}`);
                                ling.sendEvent({ uri: `topics/${i}/audio`, delta: `/api/audio?id=${tmpId}` });
                            });
                        });
                    }
                });
                bot.addListener('inference-done', (content) => {
                    console.log(JSON.parse(content));
                });
                bot.chat(JSON.stringify(topic));
            }
        });
    });

    if (searchResults) {
        quickAnswerBot.addPrompt(`参考资料:\n${searchResults}`);
        outlineBot.addPrompt(`参考资料:\n${searchResults}`);
    }

    quickAnswerBot.chat(question);
    outlineBot.chat(question);

    // ling.addListener('message', (data) => {
    //     if (data.data.includes('2/article_paragraph')) {
    //         console.log(data);
    //     }
    // });

    ling.close();

    // setting below headers for Streaming the data
    res.writeHead(200, {
        'Content-Type': "text/event-stream",
        'Cache-Control': "no-cache",
        'Connection': "keep-alive"
    });

    pipeline((ling.stream as any), res);
});

app.post('/gen-image', async (req, res) => {
    const { prompt } = req.body;

    const { url } = await generateImage(prompt);

    res.json({
        url
    });
});

const audioBuffers: Record<string, Buffer> = {};

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