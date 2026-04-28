# NodeJS + TypeScript 项目

这是一个使用NodeJS和TypeScript构建的项目，配置为编译到ES2020。

## 特性

- TypeScript 支持
- 编译目标为 ES2020
- 源码映射 (Source Maps) 支持
- 开发模式热重载

## 项目结构

```
.
├── src/            # 源代码目录
│   └── index.ts    # 入口文件
├── dist/           # 编译输出目录
├── package.json    # 项目配置
├── tsconfig.json   # TypeScript配置
└── README.md       # 项目说明
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 编译项目

```bash
npm run build
```

### 运行编译后的代码

```bash
npm start
```

### 监视模式（自动重新编译）

```bash
npm run watch
```

## ES2020 特性示例

示例代码展示了以下ES2020特性：

- 可选链操作符 (`?.`)
- 空值合并操作符 (`??`)
- `Promise.allSettled()`

## 许可证

ISC