<script setup lang="ts">
import { ref, type Ref } from 'vue';
import PictureCard from './components/PictureCard.vue';
import { get, set } from 'jsonuri';

const word = ref('请上传图片');
const audio = ref('');
const sentence = ref('');

const detailExpand = ref(false);
const imgPreview = ref('https://res.bearbobo.com/resource/upload/W44yyxvl/upload-ih56twxirei.png');

const explainations: Ref<string[]> = ref([]);
const expReply: Ref<string[]> = ref([]);


const update = async (imageData: string) => {
  imgPreview.value = imageData;

  word.value = '分析中...';

  const res = await fetch("/api/vision", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData,
    })
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let done = false;

  const data = {
    representative_word: '',
    example_sentence: '',
    explainations: [],
    explaination_replys: [],
    example_sentence_audio: '',
  };

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (!done) {
      const content = decoder.decode(value);
      const lines = content.trim().split('\n');
      for (const line of lines) {
        const input = JSON.parse(line);
        if (input.uri) {
          const content = get(data, input.uri);
          set(data, input.uri, (content || '') + input.delta);
          if (input.uri.endsWith('word')) {
            word.value = data.representative_word;
          } else if (input.uri.endsWith('sentence')) {
            sentence.value = data.example_sentence;
          } else if (input.uri.includes('explainations\/')) {
            explainations.value = [...data.explainations];
          } else if (input.uri.includes('explaination_replys')) {
            expReply.value = [...data.explaination_replys];
          } else if (input.uri.endsWith('example_sentence_audio')) {
            audio.value = data.example_sentence_audio;
          }
        }
      }
    }
  }
};

const submit = async (imageData: string) => {
  // console.log(imageData);
  update(imageData);
};
</script>

<template>
  <div class="container">
    <PictureCard @update-image="submit" :word="word" :audio="audio" />
    <div class="output">
      <div>{{ sentence }}</div>
      <div class="details">
        <button @click="detailExpand = !detailExpand">Talk about it</button>
        <div v-if="!detailExpand" class="fold"></div>
        <div v-else class="expand">
          <img :src="imgPreview" alt="preview" />
          <div class="explaination" v-for="item in explainations">
            <p>{{ item }}</p>
          </div>
          <div class="reply" v-for="item in expReply">
            <p>{{ item }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  font-size: .85rem;
  background: linear-gradient(180deg, rgb(235, 189, 161) 0%, rgb(71, 49, 32) 100%);
}

#selecteImage {
  display: none;
}

.input {
  width: 200px;
}

.output {
  margin-top: 20px;
  /* min-height: 300px; */
  width: 80%;
  text-align: center;
  font-weight: bold;
}

.preview img {
  max-width: 100%;
}

button {
  padding: 0 10px;
  margin-left: 6px;
}

.details {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.details button {
  background-color: black;
  color: white;
  width: 160px;
  height: 32px;
  border-radius: 8px 8px 0 0;
  border: none;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}

.details .fold {
  width: 200px;
  height: 30px;
  background-color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.details .expand {
  width: 200px;
  height: 88vh;
  background-color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.expand img {
  width: 60%;
  margin-top: 20px;
  border-radius: 6px;
}

.expand .explaination {
  color: black;
  font-weight: normal;
}

.expand .explaination p {
  margin: 0 10px 10px 10px;
}

.expand .reply {
  color: black;
  font-weight: normal;
  margin-top: 20px;
}

.expand .reply p {
  padding: 4px 10px;
  margin: 0 10px 10px 10px;
  border-radius: 6px;
  border: solid 1px grey;
}
</style>
