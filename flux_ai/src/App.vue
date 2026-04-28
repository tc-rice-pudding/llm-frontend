<script setup lang="ts">
import { ref } from 'vue';

const prompt = ref('A lovely rabbit');
const imgUrl = ref('');
const progress = ref('0%');

const generateImage = async () => {
  const endpoint = `https://api.bfl.ml/v1`;
  const modelName = 'flux-dev';

  const payload = {
    prompt: prompt.value,
    width: 1024,
    height: 1024,
    steps: 40,
    prompt_upsampling: true,
    seed: 42,
    guidance: 3,
    sampler: 'dpmpp_2m',
    safety_tolerance: 2,
  };

  const headers = {
    'Content-Type': 'application/json',
    'x-key': import.meta.env.VITE_API_KEY,
  };

  const res = await fetch(`${endpoint}/${modelName}`, {
    headers,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const id = (await res.json()).id;
  const resultUrl = `${endpoint}/get_result?id=${id}`;
  imgUrl.value = 'https://res.bearbobo.com/resource/upload/a3IZyOsZ/loading-giaz5ycpd7j.gif';
  do {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await fetch(resultUrl);
    const resultJson = await result.json();
    if (resultJson.status === 'Pending') {
      const progressValue = resultJson.progress;
      if (progressValue) {
        progress.value = `${Math.round(progressValue * 100)}%`;
      }
      continue;
    }
    const sample = resultJson.result?.sample;
    if (sample) {
      imgUrl.value = sample;
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
    <div class="progress">
      <div :style="{ width: progress }"></div>
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
}
</style>
