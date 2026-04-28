<script setup lang="ts">
import { ref, computed } from 'vue';

const content = ref('');
const imgBase64Data = ref('');
const isValid = computed(() => imgBase64Data.value !== '');

const updateBase64Data = async (e: Event) => {
  imgBase64Data.value = '';
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    imgBase64Data.value = reader.result as string;
  };
};

const update = async () => {
  if(!imgBase64Data.value) {
    return;
  }

  const endpoint = 'https://api.moonshot.cn/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`
  };

  content.value = '思考中...'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: 'moonshot-v1-8k-vision-preview',
      messages: [
        { role: 'user',
          content: [{
            type: "image_url", 
            image_url: {
                "url": imgBase64Data.value,
            },
          }, {
            type: "text",
            text: "请描述图片的内容。",
          }] 
        }
      ],
      stream: false,
    })
  });

  const data = await response.json();
  content.value = data.choices[0].message.content;
};
</script>

<template>
  <div class="container">
    <div>
      <label>文件：</label>
      <input class="input" type="file"
        accept=".jpg, .jpeg, .png, .gif"
        @change="updateBase64Data"/>
      <button @click="update" :disabled="!isValid">提交</button>
    </div>
    <div class="output">
      <div class="preview">
        <img v-if="imgBase64Data" :src="imgBase64Data" alt="preview" />
      </div>
      <div>{{ content }}</div>
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
.preview img {
  max-width: 100%;
}
button {
  padding: 0 10px;
  margin-left: 6px;
}
</style>
