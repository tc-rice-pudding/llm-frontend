import * as dotenv from 'dotenv'
import express from 'express';
import { Ling } from "@bearbobo/ling";
import { pipeline } from 'node:stream/promises';

dotenv.config({
    path: ['.env.local', '.env']
})

const apiKey = process.env.VITE_API_KEY;
const endpoint = process.env.VITE_END_POINT;

const app = express();
const port = 3000;

const outlinePrompt = `
根据用户要求，生成科普文章大纲。

输出以下JSON格式内容：

{
    "title": "文章标题",
    "outline": [
        {
            "section": 1,
            "title": "章节标题",
            "subtopics": "子主题1\n子主题2\n子主题3",
            "overview": "章节概述"
        },
        {
            "section": 2,
            "title": "章节标题",
            "subtopics": "子主题1\n子主题2\n子主题3",
            "overview": "章节概述"
        },
        {
            "section": 3,
            "title": "章节标题",
            "subtopics": "子主题1\n子主题2\n子主题3",
            "overview": "章节概述"
        },
        {
            "section": 4,
            "title": "总结",
            "subtopics": "子主题1\n子主题2",
            "overview": "章节概述"
        },
    ]
}
`;

const overviewPrompt = `
根据用户发送的文章标题撰写一段简短的概述。

要求：
文章的读者是6-8岁的儿童。
文章的风格要符合儿童的阅读习惯，避免使用过于复杂的句子结构和词汇。
文章的内容要围绕用户发送的文章标题进行，不要偏离主题。
限制篇幅，不要超过1个自然段落，纯文本输出，不要加任何Markdown标签。
`;

const contentPrompt = `
根据用户发送的文章标题和概述，撰写详细文章内容。

要求： 
文章的读者是6-8岁的儿童。
文章的风格要符合儿童的阅读习惯，避免使用过于复杂的句子结构和词汇。
文章的内容要围绕用户发送的文章标题和概述进行，不要偏离主题。
限制篇幅，不要超过3个自然段落，纯文本输出，不要加任何Markdown标签。
`;

// SSE 端点
app.get('/stream', async (req, res) => {
    const question = req.query.question;

    const config = {
        model_name: 'moonshot-v1-8k',
        api_key: apiKey,
        endpoint: endpoint,
        sse: true,
    };

    // ------- The work flow start --------
    const ling = new Ling(config);

    const outlineBot = ling.createBot();
    outlineBot.addPrompt(outlinePrompt);

    outlineBot.chat(question);

    outlineBot.on('string-response', ({ uri, delta }) => {
        console.log(uri, delta);
        if (uri.startsWith('title')) {
            const overviewBot = ling.createBot('overview', {}, {
                response_format: { type: "text" },
            });
            overviewBot.addPrompt(overviewPrompt);
            overviewBot.chat(delta);
        }
    });

    outlineBot.on('object-response', ({ uri, delta }) => {
        const matches = uri.match(/outline\/(\d+)/);
        if (matches) {
            const section = matches[1];
            console.log(uri, delta);
            const contentBot = ling.createBot(`content/${section}`, {}, {
                response_format: { type: "text" },
            });
            contentBot.addPrompt(contentPrompt);
            contentBot.chat(`
# 主题
${delta.title}

## 子主题
${delta.subtopics}

## 摘要
${delta.overview}
            `);
        }
    });

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
