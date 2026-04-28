<script setup lang="ts">
import { ref } from 'vue';

const prompt = ref('A lovely rabbit');
const imgUrl = ref('');

const generateImage = async () => {
  const negativeWords = 'Blurry, Bad, Bad anatomy, Bad proportions, Deformed, Disconnected limbs, Disfigured, Extra arms, Extra limbs, Extra hands, Fused fingers, Gross proportions, Long neck, Malformed limbs, Mutated, Mutated hands, Mutated limbs, Missing arms, Missing fingers, Poorly drawn hands, Poorly drawn face.';

  const endpoint = `/klingai/v1/images/generations`;

  const token = await (await fetch('/api/jwt-auth')).text();

  const payload = {
    prompt: prompt.value,
    negative_prompt: negativeWords,
    aspect_ratio: '1:1',
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const res = await fetch(endpoint, {
    headers,
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status >= 400) {
    throw new Error(`Non-200 response: ${await res.text()}`);
  }

  const ret: any = await res.json();
  const id = ret.data.task_id;
  const resultUrl = `${endpoint}/${id}`;
  imgUrl.value = 'https://res.bearbobo.com/resource/upload/a3IZyOsZ/loading-giaz5ycpd7j.gif';
  do {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await fetch(resultUrl, {
      headers,
    });
    const resultJson = await result.json();
    const taskStatus = resultJson.data.task_status;
    if (taskStatus === 'processing' || taskStatus === 'submitted') {
      continue;
    }
    if (taskStatus === 'failed') {
      throw new Error(`Task failed: ${JSON.stringify(resultJson)}`);
    }
    const sample = resultJson.data?.task_result;
    if (sample) {
      imgUrl.value = sample.images[0].url;
    } else {
      imgUrl.value = 'https://res.bearbobo.com/resource/upload/vNg4ALJv/6659895-ox36cbkajrr.png';
    }
    break;
  } while (1);
};
</script>

<template>
  <div class="container">
    <div>
      <label>Prompt </label>
      <button @click="generateImage">Generate</button>
      <textarea class="input" type="text" v-model="prompt" />
    </div>
    <div class="output">
      <img :src="imgUrl" />
    </div>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
  height: 2rem;
  font-size: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}

.progress {
  width: 100%;
  height: 0.1rem;
  margin: .4rem 0;
  background: #ccc;
}

.progress>div {
  background: #c00;
  height: 100%;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  height: 100vh;
}

.output {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px solid #ccc;
}

.output>img {
  width: 100%;
  max-width: 600px;
}
</style>
