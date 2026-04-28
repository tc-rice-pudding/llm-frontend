<script setup lang="ts">
import { marked } from 'marked';
import { type PropType } from 'vue';

interface Topic {
    topic: string,
    post_reading_question: string,
    article_paragraph?: string,
    image_prompt?: string,
}

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
            <div v-for="topic in topics" class="topic">
                <h3 class="topic-title">{{ topic.topic }}</h3>
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
    width: 600px;
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
</style>