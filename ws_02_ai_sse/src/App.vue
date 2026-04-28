<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
    </div>
    <div class="output">
      <div><label>Streaming</label><input type="checkbox" v-model="stream" /></div>
      <div>{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入Vue响应式API
import { ref } from 'vue';

/**
 * 响应式状态定义
 * question: 用户输入的问题
 * content: AI返回的回答内容
 * stream: 是否使用流式响应模式
 */
const question = ref('讲一个关于中国龙的故事'); // 默认问题
const content = ref(''); // 回答内容
const stream = ref(true); // 流式模式开关

/**
 * 提交请求函数
 * 根据stream状态选择流式或非流式方式调用AI接口
 */
const update = async () => {
  // 验证输入是否为空
  if (!question.value) return;
  
  // 显示加载状态
  content.value = "思考中...";

  // 配置API端点和请求头
  const endpoint = '/api/stream';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_MOONSHOT_API_KEY}`
  };

  // 流式响应模式
  if (stream.value) {
    content.value = ''; // 清空之前的内容
    
    // 创建EventSource连接，建立SSE流式通信
    const eventSource = new EventSource(`${endpoint}?question=${encodeURIComponent(question.value)}`);
    
    // 监听message事件，接收流式数据
    eventSource.addEventListener("message", function (e: any) {
      content.value += e.data || ''; // 累加收到的数据
    });
    
    // 监听end事件，处理流结束
    eventSource.addEventListener('end', () => {
      console.log('传输完成');
      eventSource.close(); // 关闭连接
    });
  } else {
    // 非流式响应模式，使用常规fetch请求
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'moonshot-v1-8k', // 指定AI模型
        messages: [{ role: 'user', content: question.value }], // 消息内容
        stream: stream.value, // 禁用流式
      })
    });
    
    // 解析JSON响应并显示结果
    const data = await response.json();
    content.value = data.choices[0].message.content;
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  height: 100vh;
  font-size: .85rem;
}

.input {
  width: 200px;
}

.output {
  margin-top: 10px;
  min-height: 300px;
  width: 100%;
  text-align: left;
}

button {
  padding: 0 10px;
  margin-left: 6px;
}
</style>
