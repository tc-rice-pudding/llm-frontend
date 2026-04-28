<script setup lang="ts">
import { ref } from 'vue';
import { set, get } from 'jsonuri';

const question = ref('起床');
const content = ref({
  example_sentences: [],
});

function playAudio(audio: string) {
  const audioElement = new Audio(audio);
  audioElement.play();
}

function createBlobURL(base64AudioData: string): string {
  var byteArrays = [];
  var byteCharacters = atob(base64AudioData);
  for (var offset = 0; offset < byteCharacters.length; offset++) {
    var byteArray = byteCharacters.charCodeAt(offset);
    byteArrays.push(byteArray);
  }

  var blob = new Blob([new Uint8Array(byteArrays)], { type: 'audio/mp3' });

  // 创建一个临时 URL 供音频播放
  return URL.createObjectURL(blob);
}

const update = async () => {
  if (!question) return;

  const endpoint = '/api/stream';

  const eventSource = new EventSource(`${endpoint}?question=${question.value}`);
  eventSource.addEventListener("message", function (e: any) {
    let { uri, delta } = JSON.parse(e.data);
    if (uri.includes('audio')) {
      delta = createBlobURL(delta);
    }
    const str = get(content.value, uri);
    set(content.value, uri, (str || '') + delta);
  });
  eventSource.addEventListener('end', () => {
    console.log('传输完成');
    eventSource.close();
  });
}
</script>

<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
    </div>
    <div class="output">
      <div v-for="sentence in (content.example_sentences as any)" :key="sentence.english">
        <h3>{{ sentence.english }}
          <img v-if="sentence.audio" width="20px"
            @click="playAudio(sentence.audio)"
            src="https://res.bearbobo.com/resource/upload/9nZenvln/playAudio-l42l4687b8j.png" alt="logo" />
        </h3>
        <p>{{ sentence.chinese }} </p>
      </div>
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

h3,
h3+p {
  margin: 0;
  padding: 0;
}

h3 img {
  cursor: pointer;
}
</style>
