<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';

const question = ref('你好，帮我列出目录下的文件');
const rawContent = ref('');

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

  const headers = {
    'Content-Type': 'application/json',
  };

  // console.log(question.value);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      message: question.value,
    })
  });

  const data = await response.json();
  rawContent.value = data.reply;
}
</script>

<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
    </div>
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

.think {
  margin-top: 10px;
  color: gray;
  max-height: 300px;
  overflow-y:auto;
  font-size: x-small;
}
</style>
