# RAG Demo

一个基于 TypeScript 的 Node.js 项目，实现了完整的 RAG（检索增强生成）功能演示。项目使用 Ollama 进行文本嵌入，Vectra 进行本地向量存储，提供了简单易用的 RAG 接口。

## 🚀 核心特性

### RAG 功能
- **文本嵌入**: 基于 Ollama 的 `nomic-embed-text` 模型
- **向量存储**: 使用 Vectra 进行本地文件系统存储
- **智能分块**: 自动将长文本分割为可处理的块
- **相似度检索**: 支持语义相似度查询
- **增删改查**: 完整的向量数据库操作

### 技术栈
- **TypeScript**: 完整的类型支持和严格模式
- **CommonJS**: 兼容性输出格式
- **Jest**: 完整的单元测试框架
- **ESLint + Prettier**: 代码质量和格式化
- **pnpm**: 高效的包管理工具
- **Ollama**: AI 模型推理引擎
- **Vectra**: 本地向量数据库

## 📦 项目结构

```
rag_demo/
├── src/                    # 源代码目录
│   ├── index.ts           # SimpleRag 主类实现
│   ├── types/             # 类型定义
│   │   └── index.ts       # IEmbedding 接口定义
│   └── utils/             # 工具函数
│       └── index.ts       # 文本分块和嵌入工具
├── examples/              # 使用示例
│   └── rag-usage.ts      # RAG 功能演示
├── tests/                 # 测试文件目录
│   ├── index.test.ts
│   └── utils.test.ts
├── .trae/                 # 项目配置和记忆库
│   ├── project_rules.md   # 项目开发规范
│   └── memory_bank/       # 项目记忆存储
├── .vectra/               # 向量数据库存储目录
├── dist/                  # 编译输出目录
├── tsconfig.json          # TypeScript 配置
├── jest.config.ts         # Jest 测试配置
├── .eslintrc.js          # ESLint 配置
├── .prettierrc           # Prettier 配置
└── package.json          # 项目依赖配置
```

## 🛠️ 开发环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Ollama** (用于文本嵌入)
  ```bash
  # 安装 Ollama
  curl -fsSL https://ollama.ai/install.sh | sh
  
  # 下载嵌入模型
  ollama pull nomic-embed-text
  ```

## 📋 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 确保 Ollama 运行

```bash
# 启动 Ollama 服务
ollama serve

# 确认模型可用
ollama list
```

### 3. 运行示例

```bash
# 开发模式运行
pnpm dev

# 或运行示例文件
ts-node examples/rag-usage.ts
```

### 4. 构建项目

```bash
pnpm build
```

### 5. 运行生产版本

```bash
pnpm start
```

## 🧪 测试

### 运行所有测试

```bash
pnpm test
```

### 监听模式测试

```bash
pnpm test:watch
```

### 生成测试覆盖率报告

```bash
pnpm test:coverage
```

## 🔧 代码质量

### 代码检查

```bash
pnpm lint
```

### 自动修复代码问题

```bash
pnpm lint:fix
```

### 代码格式化

```bash
pnpm format
```

## 🔧 API 文档

### SimpleRag 类

#### 初始化

```typescript
import { SimpleRag } from './src/index';

const rag = new SimpleRag();
await rag.initialize(); // 使用默认路径 '.vectra'
// 或指定自定义路径
await rag.initialize('./my-vector-db');
```

#### 添加文本

```typescript
// 添加单个文本（自动分块）
const result = await rag.add('这是一段需要索引的文本内容...');
console.log(result); // [{ id: 'uuid1' }, { id: 'uuid2' }]
```

#### 查询相似文本

```typescript
// 查询最相似的 5 个结果
const results = await rag.query('查询内容', 5);
console.log(results);
// [
//   {
//     text: '匹配的文本内容',
//     query: '查询内容',
//     simularity: 0.85,
//     id: 'uuid1'
//   }
// ]
```

#### 删除文本

```typescript
// 删除单个项目
await rag.del({ id: 'uuid1' });

// 删除多个项目
await rag.del([{ id: 'uuid1' }, { id: 'uuid2' }]);
```

#### 检查状态

```typescript
if (rag.avaliable) {
  console.log('RAG 系统已就绪');
}
```

### 工具函数

```typescript
import { getEmbeddings, getVector } from './src/utils';

// 获取文本的嵌入向量（自动分块）
const embeddings = await getEmbeddings('长文本内容...');

// 获取单个查询的向量
const vector = await getVector('查询文本');
```

## 💡 使用示例

```typescript
import { SimpleRag } from './src/index';

async function example() {
  // 1. 初始化 RAG 系统
  const rag = new SimpleRag();
  await rag.initialize();
  
  // 2. 添加知识库内容
  const docs = [
    'RAG（检索增强生成）是一种结合了检索和生成的AI技术。',
    'TypeScript 是 JavaScript 的超集，提供了静态类型检查。',
    'Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时。'
  ];
  
  const insertedIds = [];
  for (const doc of docs) {
    const result = await rag.add(doc);
    insertedIds.push(...result);
  }
  
  // 3. 查询相关内容
  const searchResults = await rag.query('什么是 RAG 技术？', 3);
  console.log('搜索结果:', searchResults);
  
  // 4. 清理数据（可选）
  await rag.del(insertedIds);
}

example().catch(console.error);
```

## 📝 开发规范

- 所有函数必须包含 TypeScript 类型注解
- 所有公共函数必须包含 JSDoc 注释
- 测试覆盖率应保持在 90% 以上
- 使用具名导出，避免默认导出
- 遵循 ESLint 和 Prettier 配置的代码风格
- 向量操作不支持并发，需要串行执行

## ⚠️ 注意事项

1. **Ollama 依赖**: 确保 Ollama 服务正在运行且 `nomic-embed-text` 模型已下载
2. **文件系统存储**: Vectra 使用文件系统存储，不支持并发写入操作
3. **文本分块**: 长文本会自动分割为 300 字符的块，重叠 50 字符
4. **向量维度**: 使用 `nomic-embed-text` 模型，向量维度为 768

## 🔍 故障排除

### Ollama 连接问题

```bash
# 检查 Ollama 服务状态
curl http://localhost:11434/api/tags

# 重启 Ollama 服务
ollama serve
```

### 向量数据库问题

```bash
# 清理向量数据库
rm -rf .vectra

# 重新初始化
ts-node -e "import('./src/index').then(({SimpleRag}) => new SimpleRag().initialize())"
```

## 🤝 贡献指南

1. 确保所有测试通过 (`pnpm test`)
2. 遵循项目的代码规范 (`pnpm lint`)
3. 为新功能添加相应的测试用例
4. 更新相关文档和示例
5. 确保 Ollama 集成正常工作

## 📚 相关资源

- [Ollama 官方文档](https://ollama.ai/)
- [Vectra 向量数据库](https://github.com/Stevenic/vectra)
- [nomic-embed-text 模型](https://ollama.ai/library/nomic-embed-text)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

## 📄 许可证

ISC License