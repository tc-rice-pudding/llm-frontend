<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';
import { fetchEventSource } from '@microsoft/fetch-event-source';

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

  const DIFY_API = import.meta.env.VITE_DIFY_API_URL || 'http://127.0.0.1/v1';
  const API_KEY = import.meta.env.VITE_DIFY_API_KEY;
  const WORKFLOW_ID = import.meta.env.VITE_DIFY_WORKFLOW_ID;

  const endpoint = `${DIFY_API}/workflows/run`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  const body = JSON.stringify({
    workflow_id: WORKFLOW_ID,
    inputs: {
      input: question.value,
    },
    response_mode: stream.value ? 'streaming' : 'blocking',
    user: 'bearbobo',
  });

  // console.log(question.value);

  if (stream.value) {
    rawContent.value = '';
    fetchEventSource(endpoint, {
      method: 'POST',
      headers,
      body,
      onmessage: (event) => {
        try {
          if(!event.data) return;
          const data = JSON.parse(event.data);
          if(data.event === 'text_chunk') {
            rawContent.value += data.data.text;
          }
        } catch (e) {
          console.error(e, event.data);
        }
      },
    });

  } else {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });
    const { data } = await response.json();
    rawContent.value = data.outputs.text;
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
