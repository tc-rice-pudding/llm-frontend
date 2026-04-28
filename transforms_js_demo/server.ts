import express, { Request, Response } from 'express';
import { pipeline, env } from '@huggingface/transformers';

const app = express();
app.use(express.json());

// ✅ 启用本地模型
env.allowLocalModels = true;

// ✅ 初始化模型
let sentimentPipeline: any;
const initModel = async () => {
  console.log('🔄 正在加载模型...');
  sentimentPipeline = await pipeline(
    'sentiment-analysis',
    './onnx_model',  // 指向本地的模型目录
    { 
      device: "gpu",
      dtype: "fp32", // 使用 fp16 提高性能
      revision: undefined,          // 避免从 HuggingFace Hub 下载
      local_files_only: true        // 强制只使用本地文件
    }
  );
  console.log('✅ 模型加载完成！');
};

// ✅ 提供API
app.post('/api/sentiment', async (req: Request, res: Response): Promise<any> => {
  try {
    const text = req.body.text;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const result = await sentimentPipeline(text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Inference failed' });
  }
});

// ✅ 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
  await initModel();
});