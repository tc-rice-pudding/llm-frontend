# 组件上下文记录

## 🧩 组件架构设计

### 主要组件层次结构
```
App.vue
├── AppLayout.vue
│   ├── AppHeader.vue
│   │   └── ThemeToggle.vue
│   ├── SentimentAnalyzer.vue (主组件)
│   │   ├── TextInput.vue
│   │   ├── SentimentDisplay.vue
│   │   └── LoadingSpinner.vue
│   └── AppFooter.vue
```

## 📝 组件详细设计

### 1. SentimentAnalyzer.vue
**用途**: 情感分析主组件，协调文本输入和结果展示  
**位置**: `src/components/SentimentAnalyzer.vue`  
**状态**: 待开发

**Props**:
- `modelName?: string` - 使用的情感分析模型名称
- `debounceMs?: number` - 输入防抖延迟时间

**Events**:
- `analysis-complete` - 分析完成事件
- `analysis-error` - 分析错误事件

**功能**:
- 管理 transformers.js 模型加载
- 处理文本分析逻辑
- 协调子组件状态

### 2. TextInput.vue
**用途**: 文本输入组件，支持实时输入和格式化  
**位置**: `src/components/TextInput.vue`  
**状态**: 待开发

**Props**:
- `modelValue: string` - 输入文本内容
- `placeholder?: string` - 占位符文本
- `maxLength?: number` - 最大字符数限制
- `disabled?: boolean` - 是否禁用输入

**Events**:
- `update:modelValue` - 文本更新事件
- `input-change` - 输入变化事件

**Slots**:
- `prepend` - 输入框前置内容
- `append` - 输入框后置内容

### 3. SentimentDisplay.vue
**用途**: 情感分析结果展示，支持文本高亮和情感标记  
**位置**: `src/components/SentimentDisplay.vue`  
**状态**: 待开发

**Props**:
- `text: string` - 原始文本
- `sentiments: SentimentResult[]` - 情感分析结果
- `showConfidence?: boolean` - 是否显示置信度

**类型定义**:
```typescript
interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  startIndex: number;
  endIndex: number;
}
```

### 4. LoadingSpinner.vue
**用途**: 加载状态指示器  
**位置**: `src/components/LoadingSpinner.vue`  
**状态**: 待开发

**Props**:
- `size?: 'sm' | 'md' | 'lg'` - 尺寸大小
- `color?: string` - 颜色主题
- `text?: string` - 加载提示文本

### 5. ThemeToggle.vue
**用途**: 主题切换按钮，支持亮/暗模式切换  
**位置**: `src/components/ThemeToggle.vue`  
**状态**: 待开发

**Props**:
- `size?: 'sm' | 'md' | 'lg'` - 按钮尺寸

**Events**:
- `theme-change` - 主题切换事件

## 🎨 样式规范

### 情感标记颜色
- **正向情感**: `text-red-500 bg-red-50 dark:bg-red-900/20`
- **负向情感**: `text-green-500 bg-green-50 dark:bg-green-900/20`
- **中性情感**: `text-gray-500 bg-gray-50 dark:bg-gray-900/20`

### 组件通用样式类
- **卡片容器**: `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700`
- **输入框**: `w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500`
- **按钮**: `px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors`

## 🔧 组件开发优先级

1. **LoadingSpinner** (基础组件)
2. **TextInput** (输入组件)
3. **SentimentDisplay** (展示组件)
4. **SentimentAnalyzer** (主逻辑组件)
5. **ThemeToggle** (功能增强)

## 📋 组件开发检查清单

### 每个组件必须包含:
- [ ] TypeScript 类型定义
- [ ] Props 验证和默认值
- [ ] 详细的组件注释
- [ ] 响应式设计支持
- [ ] 亮/暗模式兼容
- [ ] 无障碍访问支持
- [ ] 错误边界处理