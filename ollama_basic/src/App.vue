<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';

const question = ref('讲一个关于中国龙的故事');
const rawContent = ref('');
const stream = ref(true);

const thinkContent = computed(() => {
  if(rawContent.value.startsWith('<think>')) {
    const match = rawContent.value.match(/^<think>([\s\S]*?)<\/think>/im);
    return match ? match[1] : rawContent.value.replace(/^<think>/, '');
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

const update = async () => {
  if (!question) return;
  rawContent.value = "思考中...";

  const OLLAMA_API = import.meta.env.VITE_OLLAMA_API || 'http://localhost:11434';
  const MODEL_NAME = import.meta.env.VITE_OLLAMA_MODEL;

  const endpoint = `${OLLAMA_API}/api/generate`;
  const headers = {
    'Content-Type': 'application/json',
  };

  // console.log(question.value);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt: question.value,
      stream: stream.value,
    })
  });

  if (stream.value) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';
    rawContent.value = '';

    while (!done) {
      const { value, done: doneReading } = await (reader?.read() as Promise<{ value: any; done: boolean }>);
      done = doneReading;
      const chunkValue = buffer + decoder.decode(value);
      buffer = '';

      const lines = chunkValue.split('\n').filter(Boolean);

      // console.log(lines); // for debugging

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          const delta = data.response;
          if (delta) rawContent.value += delta;
        } catch (ex) {
          buffer += line;
        }
      }
    }
  } else {
    const data = await response.json();
    rawContent.value = data.response;
  }
}
</script>

<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
    </div>
    <div class="output">
      <div><label>Streaming</label><input type="checkbox" v-model="stream" /></div>
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

.think {
  margin-top: 10px;
  color: gray;
  max-height: 300px;
  overflow-y:auto;
  font-size: x-small;
}
</style>
