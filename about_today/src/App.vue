<script setup lang="ts">
import DatePicker from "./components/DatePicker.vue";

import { ref } from "vue";
import nunjucks from "nunjucks";
import systemPrompt from "./tpl/prompt.tpl.ts";

const today = ref(new Date().toISOString().split("T")[0]);
const reply = ref("");

const dateUpdate = (date: string) => {
  today.value = date;
};

const submit = async () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const endpoint = import.meta.env.VITE_BASE_URL;
  const model = import.meta.env.VITE_AI_MODEL;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const prompt = nunjucks.renderString(systemPrompt, {
    today: today.value,
  });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: "介绍今天相关的知识" }
      ],
      stream: true,
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let buffer = '';
  reply.value = '';

  while (!done) {
    const { value, done: doneReading } = await (reader?.read() as Promise<{ value: any; done: boolean }>);
    done = doneReading;
    const chunkValue = buffer + decoder.decode(value);

    const lines = chunkValue.split('\n').filter((line) => line.startsWith('data: '));

    for (const line of lines) {
      const incoming = line.slice(6);
      if (incoming === '[DONE]') {
        done = true;
        break;
      }
      try {
        const data = JSON.parse(incoming);
        const delta = data.choices[0].delta.content;
        if (delta) reply.value += delta;
      } catch (ex) {
        buffer += incoming + '\n';
      }
    }
  }
};
</script>

<template>
  <div class="container">
    <h1>About Today</h1>
    <div class="panel">
      <DatePicker @date-update="dateUpdate" :value="today" />
      <button @click="submit">提交</button>
    </div>
    <div class="output">
      <div>{{ reply }}</div>
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

.panel {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  width: 100%;
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
