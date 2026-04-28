# 项目技术规范

## 🛠 技术选型

### 核心框架
- **Vue 3** + Composition API
- **TypeScript** 严格模式
- **Vite** 构建工具
- **pnpm** 包管理器

### 样式系统
- **UnoCSS** 原子化 CSS
- 支持亮/暗模式切换
- 使用 CSS 变量和 design tokens
- 禁止硬编码颜色值

### 图标系统
- **unplugin-icons** + **Iconify**
- 按需加载图标
- 统一图标命名规范

### 网络请求
- **axios** HTTP 客户端
- 模块化 API 封装在 `services/` 目录
- 统一错误处理和拦截器

### AI/ML 库
- **@xenova/transformers** 用于客户端机器学习
- 使用线上模型 `optimum/bert-base-chinese-onnx` 进行中文情感分析
- 支持 WebGPU 加速和 fp16 精度优化

## 📁 目录结构

```
src/
├── components/          # 可复用组件
├── pages/              # 页面组件
├── layouts/            # 布局组件
├── services/           # API 服务封装
├── styles/             # 全局样式
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
└── assets/             # 静态资源
```

## 🎨 设计系统

### 颜色变量
```css
:root {
  /* 主色调 */
  --color-primary: #3b82f6;
  --color-primary-dark: #1d4ed8;
  
  /* 情感色彩 */
  --color-positive: #ef4444;  /* 正向情感 - 红色 */
  --color-negative: #22c55e;  /* 负向情感 - 绿色 */
  --color-neutral: #6b7280;   /* 中性情感 - 灰色 */
  
  /* 背景色 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  
  /* 文本色 */
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
}

[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #111827;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
}
```

## 📝 组件规范

### 命名规范
- 组件文件：PascalCase (如 `SentimentAnalyzer.vue`)
- 组件注册：PascalCase
- Props：camelCase
- Events：kebab-case

### 组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
/**
 * 组件名称：ComponentName
 * 用途：组件功能描述
 * 位置：组件在项目中的位置
 * 用法：使用示例
 */

// 导入
// Props 定义
// 响应式数据
// 计算属性
// 方法
// 生命周期
</script>

<style scoped>
/* 使用 UnoCSS 类名或 CSS 变量 */
</style>
```

## 🔧 开发规范

### 代码质量
- 所有组件必须包含 TypeScript 类型
- 必须添加组件注释说明
- 支持 Props 验证和默认值
- 支持 Slots 插槽机制

### 样式规范
- 优先使用 UnoCSS 原子类
- 使用 CSS 变量而非硬编码
- 确保亮/暗模式兼容
- 响应式设计优先

### API 调用规范
- 统一在 `services/` 目录封装
- 使用 TypeScript 接口定义响应类型
- 统一错误处理机制

## 🎯 项目特定规范

### 情感分析功能
- 使用 `@xenova/transformers` 进行客户端情感分析
- 正向情感标记：红色 (`--color-positive`)
- 负向情感标记：绿色 (`--color-negative`)
- 中性情感标记：灰色 (`--color-neutral`)
- 支持实时文本分析
- 支持批量文本处理

### 性能优化
- 模型懒加载
- 文本分块处理
- 结果缓存机制
- 防抖输入处理