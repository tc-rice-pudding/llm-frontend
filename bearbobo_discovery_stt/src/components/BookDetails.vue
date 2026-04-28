<script setup lang="ts">
import { marked } from 'marked';
import { ref, type PropType, type Ref } from 'vue';

interface Topic {
    topic: string,
    post_reading_question: string,
    article_paragraph?: string,
    image_prompt?: string,
    audio?: string,
}

const pictures: Ref<string[]> = ref([]);

defineProps({
    image: {
        type: String,
        default: '',
    },
    question: {
        type: String,
        default: '',
    },
    introduction: {
        type: String,
        default: '',
    },
    expand: {
        type: Boolean,
        default: false,
    },
    topics: {
        type: Array as PropType<Topic[]>,
        default: [],
    }
});

const addPic = async (index: number, image_prompt: string) => {
    // console.log(index);
    const picture = pictures.value[index];
    if (picture) return;
    pictures.value[index] = 'https://res.bearbobo.com/resource/upload/e8OEDOJz/loading-5ra4dqqajj4.png';
    const res = await fetch('/api/gen-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: image_prompt,
        }),
    });
    const data = await res.json();
    pictures.value[index] = data.url;
}

const playAudio = (audioUrl: string) => {
  const audio = new Audio(audioUrl);
  audio.play();
}
</script>

<template>
    <div v-if="expand" class="details" @click.stop="">
        <div class="cover">
            <img :src="image || 'https://res.bearbobo.com/resource/upload/hR5b3aZt/10wwhys-aszp2n7g6wp.jpeg'"
                alt="book cover" class="img-fluid" />
        </div>
        <h1>{{ question }}</h1>
        <p class="introduction" v-html="marked.parse(introduction)"></p>
        <div class="article">
            <div v-for="(topic, index) in topics" :key="index"
                :class="{ 'topic': true, 'odd': index % 2 === 0, 'even': index % 2 !== 0 }">
                <div class="topic-title">
                    <h3>{{ topic.topic }}</h3>
                    <div v-if="topic.image_prompt" class="btn" @click="addPic(index, topic.image_prompt)">配图</div>
                    <div v-if="topic.audio" class="btn" @click="playAudio(topic.audio)">听书</div>
                </div>
                <img v-if="pictures[index]" :src="pictures[index]" alt="插图" />
                <p class="article_paragraph" v-html="marked.parse(topic.article_paragraph || '')"></p>
                <p class="post-reading-question">{{ topic.post_reading_question }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.details {
    position: absolute;
    top: 90px;
    width: 720px;
    height: 800px;
    overflow-y: auto;
    background-color: white;
    box-shadow: #aaa 0px 0px 10px 10px;
}

@media (prefers-color-scheme: dark) {
    .details {
        background-color: #333;
    }
}

.cover {
    height: 260px;
    overflow: hidden;
    position: relative;
}

.img-fluid {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
}

.introduction {
    padding: 20px;
    font-size: 1rem;
    border-bottom: solid 1px #ccc;
}

.article {
    padding: 20px;
    text-align: start;
}

.topic-title {
    display: flex;
    flex-direction: row;
    margin-top: 40px;
}

.topic:first-child .topic-title {
    margin: 0;
}

.topic-title h3 {
    margin: 0;
}

.topic-title .btn {
    margin-right: 20px;
    cursor: pointer;
}

.topic-title .btn:first-of-type {
    margin-left: auto;
}

.topic-title .btn::before {
    content: "< "
}

.topic-title .btn::after {
    content: " >"
}

/* 奇数段落：图左文右 */
.topic.odd img {
    float: left;
    margin-right: 20px;
}

/* 偶数段落：图右文左 */
.topic.even img {
    float: right;
    margin-left: 20px;
}

/* 图片样式 */
.topic img {
    width: 200px;
    height: auto;
    border-radius: 8px;
    margin-top: 20px;
}
</style>