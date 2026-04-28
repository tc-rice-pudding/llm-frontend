<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { marked } from 'marked';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const question = ref('你好，帮我列出当前目录下的文件');
const rawContent = ref('');
const status = ref('');

const thinkContent = computed(() => {
  if(rawContent.value.startsWith('<think>')) {
    const match = rawContent.value.match(/^<think>([\s\S]*?)<\/think>/im);
    return (match ? match[1] : rawContent.value).replace(/^<think>/mg, '');
  }
  return '';
});

const replyContent = computed(() => {
  let content = '';
  if(rawContent.value.startsWith('<think>')) {
    content = rawContent.value.split('</think>')[1] || '';
  } else {
    content = rawContent.value || '';
  }
  return marked(content);
});

// 用于控制流式连接的中止控制器
const abortController = ref<AbortController | null>(null);

// 关闭流式连接
const closeConnection = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
};

// 在组件卸载时关闭连接
onUnmounted(() => {
  closeConnection();
});

// 非流式更新
const update = async () => {
  if (!question.value) return;
  closeConnection(); // 确保关闭之前的连接
  status.value = "思考中...";

  const headers = {
    'Content-Type': 'application/json',
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      message: question.value,
    })
  });
  status.value = "";
  const data = await response.json();
  rawContent.value = data.reply;
};

// 流式更新
const updateStream = async () => {
  if (!question.value) return;
  closeConnection(); // 确保关闭之前的连接
  status.value = "思考中...";
  rawContent.value = '';

  // 创建新的AbortController用于控制请求
  abortController.value = new AbortController();
  
  try {
    await fetchEventSource('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question.value,
      }),
      signal: abortController.value.signal,
      // 处理不同类型的事件
      onmessage(event) {
        if(event.event === 'tool_call') {
          status.value = `调用工具: ${event.data}`;
          rawContent.value = rawContent.value.replace(/<\/think>/, '\n\n');
        } else {
          status.value = '';
        }

        try {
          const data = JSON.parse(event.data);
          if (data.content) {
            rawContent.value += data.content;
          }
        } catch (e) {
          console.error('解析消息出错:', e);
        }
      },
      // 根据事件类型处理不同的事件
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          return; // 连接成功
        }
        throw new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
      },
      // 处理不同类型的事件
      onerror(err) {
        console.error('SSE错误:', err);
        rawContent.value += '\n\n*连接出错，请重试*';
        return; // 不重试，关闭连接
      },
    });
  } catch (e) {
    console.error('流式连接错误:', e);
    rawContent.value += '\n\n*连接出错，请重试*';
  } finally {
    status.value = "";
  }
}
</script>

<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">普通提交</button>
      <button @click="updateStream" class="stream-btn">流式提交</button>
    </div>
    <div class="state-indicator">{{ status }}</div>
    <div class="output">
      <div class="think">{{ thinkContent }}</div>
      <div v-html="replyContent"></div>
    </div>
  </div>
</template>

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

.stream-btn {
  background-color: #4CAF50;
  color: white;
}

.static-indicator {
  margin-top: 10px;
  font-size: 0.8rem;
  color: blue;
  font-weight: bold;
}

.think {
  margin-top: 10px;
  color: gray;
  max-height: 300px;
  overflow-y:auto;
  font-size: x-small;
}
</style>
