<script setup lang="ts">
import { marked } from 'marked';
defineProps({
    image: {
        type: String,
        default: '',
    },
    question: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    }
});

const emit = defineEmits(['expand']);
const expand = () => {
    emit('expand');
}
</script>

<template>
    <div v-if="description" class="card" @click="expand">
        <div v-if="image" class="cover">
            <img :src="image" alt="book cover" class="img-fluid" />
        </div>
        <div v-else class="cover animated-border">
            <img src="https://res.bearbobo.com/resource/upload/hR5b3aZt/10wwhys-aszp2n7g6wp.jpeg" alt="book cover"
                class="img-fluid" />
        </div>
        <div class="description">
            <h3>{{ question }}</h3>
            <div v-html="marked.parse(description)"></div>
        </div>
    </div>
</template>

<style scoped>
.card {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    min-width: 600px;
    border: solid 2px #ccc;
    border-radius: 24px;
    padding: 0;
    margin: 40px 0px;
    cursor: pointer;
    position: relative;
}

.description {
    flex-grow: 2;
    padding: 20px;
    max-width: 600px;
}

.description h3 {
    position: absolute;
    top: 5px;
}

.cover {
    width: 160px;
    height: 160px;
    font-size: 0;
}

.animated-border {
    box-sizing: border-box;
    display: inline-block;
    border: 4px solid transparent;
    border-radius: 20px 0 0 20px;

    /* 两层背景：第一层填充内容区（白色），第二层绘制渐变边框 */
    background-image:
        linear-gradient(#fff, #fff),
        linear-gradient(90deg, #f00, #0f0, #00f);
    background-origin: border-box;
    background-clip: padding-box, border-box;

    background-size: 200% 200%;
    animation: border-slide 4s linear infinite;
}

@keyframes border-slide {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.img-fluid {
    border-radius: 16px 0 0 16px;
    width: 100%;
}
</style>