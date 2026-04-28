<script setup lang="ts">
import { ref } from 'vue';
import { JSONParser } from './lib/json-parser';
import { set, get } from 'jsonuri';

const question = ref('狼来了');
const content = ref('');
const contentParsed = ref({
  story_instruction: '',
  the_whole_story_content: '',
  the_whole_story_translate_to_en: '',
  lessons: []
});

const systemPrompt = `
根据用户输入的主题，用**中文**输出以下JSON格式内容：

{
  "story_instruction": "",
  "the_whole_story_content": "",
  "the_whole_story_translate_to_en": "",
  "lessons": []
}
`;

const update = async () => {
  if (!question) return;
  content.value = "思考中...";

  const response = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-qIbMpINPM6m7HldUMpqxmoj1jUKNqmSaEYCHCq9nDF31ZWEt`
      },
    body: JSON.stringify({
      model: 'kimi-k2.5',
      messages: [
        { role:'system', content: systemPrompt},
        { role: 'user', content: question.value }
      ],
      stream: true,
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const jsonParser = new JSONParser();

  jsonParser.on('data', ({uri, delta}) => {
    console.log(uri, delta);
    const content = get(contentParsed.value, uri);
    set(contentParsed.value, uri, (content || '') + delta);
  });

  let done = false;
  let buffer = '';
  content.value = '';

  while (!done) {
    const { value, done: doneReading } = await (reader?.read() as Promise<{ value: any; done: boolean }>);
    done = doneReading;
    const chunkValue = buffer + decoder.decode(value);
    buffer = '';

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
        if (delta) {
          content.value += delta;
          jsonParser.trace(delta);
        }
      } catch (ex) {
        buffer += `data: ${incoming}`;
      }
    }
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
      <textarea>{{ content }}</textarea>
      <textarea>{{ contentParsed }}</textarea>
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

textarea {
  width: 300px;
  height: 200px;
  font-size: 10px;
}
</style>
