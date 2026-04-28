<script setup lang="ts">
import { ref, type Ref } from 'vue';
import MakeQuestion from './components/MakeQuestion.vue';
import { marked } from 'marked';
import BookCard from './components/BookCard.vue';
import BookDetails from './components/BookDetails.vue';
import { set, get } from 'jsonuri';

import { Recognizer } from './lib/voice';

const question = ref('天空为什么是蓝色的？');

const rewritedQuestions: Ref<Array<string>> = ref([]);

let queries: string[][] = [];

const update = async () => {
  if (!question) return;
  rewritedQuestions.value = [];
  quickAnswer.value = '';
  description.value = '';
  queries = [];

  const endpoint = '/api/make-question';
  const eventSource = new EventSource(`${endpoint}?question=${question.value}`);

  eventSource.addEventListener("message", function (e: any) {
    let { uri, delta } = JSON.parse(e.data);
    let matches = uri.match(/questions\/(\d+)\/question$/);
    if (matches) {
      const index = parseInt(matches[1]);
      rewritedQuestions.value[index] = rewritedQuestions.value[index] || '';
      rewritedQuestions.value[index] += delta;
    }
    matches = uri.match(/questions\/(\d+)\/query\/(\d+)$/);
    if (matches) {
      const index = parseInt(matches[1]);
      const queryIndex = parseInt(matches[2]);
      queries[index] = queries[index] || [];
      queries[index][queryIndex] = queries[index][queryIndex] || '';
      queries[index][queryIndex] += delta;
    }
  });
  eventSource.addEventListener('finished', () => {
    console.log('传输完成');
    eventSource.close();
  });
}

const coverUrl = ref('');
const quickAnswer = ref('');
const description = ref('');
const details: any = { topics: [] };

const topics: Ref<any[]> = ref([]);

const questionSelected = (question: string, index: number) => {
  // console.log('questionSelected', question);
  // console.log('queries', queries[index]);
  quickAnswer.value = '';
  description.value = '';
  const query = queries[index].join(';');
  const endpoint = '/api/generate';
  const eventSource = new EventSource(`${endpoint}?question=${question}&query=${query}`);
  eventSource.addEventListener("message", function (e: any) {
    let { uri, delta } = JSON.parse(e.data);
    if (uri.endsWith('quick-answer')) {
      quickAnswer.value += delta;
    }
    if (uri.endsWith('introduction')) {
      description.value += delta;
    }
    if (uri.endsWith('cover_image')) {
      coverUrl.value = delta;
    }
    if (uri.startsWith('topics')) {
      let content = get(details, uri) || '';
      set(details, uri, content + delta);
      topics.value = [...details.topics];
    }
  });
  eventSource.addEventListener('finished', () => {
    console.log('传输完成');
    // console.log(details);
    eventSource.close();
  });
}

const expand = ref(false);
const showDetails = () => {
  setTimeout(() => {
    if (!expand.value) expand.value = true;
  });
}

const recognizer = new Recognizer();
const isRecording = ref(false);
recognizer.onAudioTranscription = ({ text }) => {
  // console.log({text, done});
  question.value = text;
};
const startRecording = () => {
  isRecording.value = true;
  question.value = '';
  recognizer.start();
}

const stopRecording = () => {
  isRecording.value = false;
  recognizer.stop();
}
</script>

<template>
  <div class="container" @click="expand && (expand = false)">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
      <button v-if="!isRecording" @click.prevent="startRecording()">🎤 开始录音</button>
      <button class="recording" v-if="isRecording" @click.prevent="stopRecording()">🎤 停止录音</button>
    </div>
    <div class="output">
      <MakeQuestion :questions="rewritedQuestions" @selection="questionSelected" />
      <div v-html="marked.parse(quickAnswer)"></div>
      <BookCard :image="coverUrl" :description="description" :question="question" @expand="showDetails()" />
    </div>
    <BookDetails :image="coverUrl" :expand="expand" :introduction="description" :question="question" :topics="topics" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  width: 100%;
  height: 100vh;
  font-size: .85rem;
}

.input {
  width: 200px;
}

.output {
  margin-top: 30px;
  min-height: 300px;
  width: 100%;
  text-align: left;
}

button {
  padding: 0 10px;
  margin-left: 6px;
  user-select: none;
}

button.recording {
  background-color: rgb(231, 148, 228);
}

textarea {
  width: 300px;
  height: 200px;
  font-size: 10px;
}
</style>
