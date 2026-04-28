/**
 * SSE (Server-Sent Events) 服务器端实现
 * 用于与Moonshot AI模型进行流式通信
 */

// 导入依赖模块
import * as dotenv from 'dotenv';
import express from 'express';

// 加载环境变量配置，优先读取 .env.local，其次 .env
dotenv.config({
    path: ['.env.local', '.env']
});

// 初始化应用配置
const openaiApiKey = process.env.VITE_MOONSHOT_API_KEY; // Moonshot API密钥
const app = express(); // 创建Express应用实例
const port = 3000; // 服务器监听端口
const endpoint = 'https://api.moonshot.cn/v1/chat/completions'; // Moonshot API端点

/**
 * SSE 流式响应端点
 * 接收客户端请求，向Moonshot API发起流式调用，并将响应流式返回给客户端
 * @param {Object} req - 请求对象，包含查询参数 question
 * @param {Object} res - 响应对象
 */
app.get('/stream', async (req, res) => {
    // 设置SSE响应头部，确保浏览器能正确解析服务器发送的事件
    res.setHeader('Content-Type', 'text/event-stream'); // 声明为事件流类型
    res.setHeader('Cache-Control', 'no-cache'); // 禁用缓存
    res.setHeader('Connection', 'keep-alive'); // 保持长连接
    res.flushHeaders(); // 立即发送响应头，建立连接

    try {
        // 向Moonshot API发起POST请求，获取流式响应
        const response = await fetch(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`, // API认证
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k', // 指定使用的AI模型
                    messages: [{ role: 'user', content: req.query.question }], // 用户输入消息
                    stream: true, // 启用流式响应模式
                })
            }
        );

        // 检查API响应状态
        if (!response.ok) {
            throw new Error('Failed to fetch from OpenAI');
        }

        // 创建读取器和解码器，用于处理流式响应
        const reader = response.body.getReader(); // 获取响应体的读取器
        const decoder = new TextDecoder(); // 创建文本解码器
        let done = false; // 流读取完成标志
        let buffer = ''; // 用于暂存不完整的数据块

        // 循环读取流式数据并转发到客户端
        while (!done) {
            const { value, done: doneReading } = await reader.read(); // 读取下一块数据
            done = doneReading; // 更新完成状态
            const chunkValue = buffer + decoder.decode(value, { stream: true }); // 解码数据
            buffer = ''; // 清空缓冲区

            // 按行分割数据，筛选以 "data: " 开头的有效SSE消息
            const lines = chunkValue.split('\n').filter(line => line.trim() && line.startsWith('data: '));
            for (const line of lines) {
                const incoming = line.slice(6); // 去除 "data: " 前缀
                if (incoming === '[DONE]') {
                    done = true; // 标记流结束
                    break;
                }
                try {
                    const data = JSON.parse(incoming); // 解析JSON数据
                    const delta = data.choices[0].delta.content; // 提取增量内容
                    if (delta) res.write(`data: ${delta}\n\n`); // 将内容发送给客户端
                } catch (ex) {
                    buffer += incoming; // JSON解析失败，暂存到缓冲区等待后续数据
                }
            }
        }

        // 发送结束事件，通知客户端数据流完成
        res.write('event: end\n'); // 自定义结束事件
        res.write('data: [DONE]\n\n'); // 发送结束标记
        res.end(); // 关闭连接

    } catch (error) {
        // 处理异常情况
        console.error('Error fetching from OpenAI:', error);
        res.write('data: Error fetching from OpenAI\n\n'); // 向客户端发送错误信息
        res.end(); // 关闭连接
    }
});

/**
 * 启动Express服务器
 * 监听指定端口，打印服务启动信息
 */
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
