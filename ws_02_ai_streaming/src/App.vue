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
import { ref } from 'vue';

// 用户输入的问题/指令
const question = ref('讲一个关于中国龙的故事');
// 流式返回的文本内容
const content = ref('');
// 是否启用流式输出
const stream = ref(true);

/**
 * 提交问题并获取AI返回结果
 * 支持流式和非流式两种模式
 */
const update = async () => {
  // 空值检查，防止无效请求
  if (!question) return;
  // 显示加载状态
  content.value = "思考中...";

  // Moonshot API 端点
  const endpoint = 'https://api.moonshot.cn/v1/chat/completions';
  // 请求头配置，包含Content-Type和认证信息
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_MOONSHOT_API_KEY}`
  };

  // 调试：打印用户输入的问题
  console.log(question.value);
  // 发送POST请求到Moonshot API
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [{ role: 'user', content: question.value }],
      stream: stream.value,
    })
  });

  // 根据是否启用流式输出选择不同的处理方式
  if (stream.value) {
    // 流式输出模式：逐块读取响应数据
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;
    // 用于暂存不完整的JSON数据
    let buffer = '';
    // 清空之前的内容
    content.value = '';

    // 循环读取流数据直到完成
    while (!done) {
      const { value, done: doneReading } = await (reader?.read() as Promise<{ value: any; done: boolean }>);
      done = doneReading;
      // 解码当前数据块并与缓冲区数据合并
      const chunkValue = buffer + decoder.decode(value);
      buffer = '';

      // 按行分割，过滤出data:开头的行
      const lines = chunkValue.split('\n').filter((line) => line.startsWith('data: '));

      // 遍历每行数据
      for (const line of lines) {
        // 去掉"data: "前缀
        const incoming = line.slice(6);
        // 检查是否是结束标志
        if (incoming === '[DONE]') {
          done = true;
          break;
        }
        try {
          // 解析JSON数据，提取增量内容
          const data = JSON.parse(incoming);
          const delta = data.choices[0].delta.content;
          // 将增量内容追加到显示内容
          if (delta) content.value += delta;
        } catch (ex) {
          // JSON解析失败说明数据不完整，存入缓冲区等待下次处理
          buffer += incoming;
        }
      }
    }
  } else {
    // 非流式输出模式：等待完整响应后直接显示
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
