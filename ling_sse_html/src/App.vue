<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { set, get } from 'jsonuri';

const resume = ref(`
姓名：月影
2004年毕业于浙江大学
2008-2011年就职于百度FE
2012-2020年就职于360
2020年至今就职于字节跳动

前端工程师/全栈工程师
擅长前端架构、跨端开发和AI应用开发
技术栈：HTML/CSS/JavaScript/TypeScript/Vue/React/Node.js/Express.js/MySQL/Redis/GraphQL/AI
`);
const content: Ref<any> = ref({ nodeType: 'element', children: [] });
const contentHtml = ref('');

const xpathToUri = (xpath: string) => {
  return xpath.replace(/\/?([\$a-zA-Z_][\$a-zA-Z0-9_-]*)\[(\d+)\]/g, (_match, tag, index) => {
    return `/children/${parseInt(index) - 1}`;
  }).slice(1);
}

const getPath = (xpath: string) => {
  const uri = xpathToUri(xpath);
  return get(content.value, uri);
}

const setPath = (xpath: string, value: any) => {
  const uri = xpathToUri(xpath);
  if (/\/\d+$/.test(uri)) {
    const parentUri = uri.replace(/\/\d+$/, '');
    const parent = get(content.value, parentUri);
    if (!parent) {
      set(content.value, parentUri, []);
    }
    set(content.value, uri, value);
  } else {
    set(content.value, uri, value);
  }
}

const parseNodeToHTML = (node = content.value) => {
  let ret = '';

  if (node.nodeType === 'element') {
    const attributes = node.attributes;
    let attributesStr = '';
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        attributesStr += ` ${key}="${value}"`;
      }
    }
    if (node.nodeName) ret += `<${node.nodeName}${attributesStr}>`;
    if (node.children?.length) {
      ret += node.children.map(parseNodeToHTML).join('');
    }
    if (node.nodeName) ret += `</${node.nodeName}>`;
  } else if (node.nodeType === 'text') {
    ret = node.nodeValue;
  }

  return ret;
}

const update = async () => {
  if (!resume) return;

  const endpoint = '/api/stream';

  const eventSource = new EventSource(`${endpoint}?resume=${resume.value}`);
  eventSource.addEventListener("message", function (e: any) {
    const data = JSON.parse(e.data);
    if (data.type === 'open_tag') {
      setPath(data.path, {
        nodeName: data.name,
        nodeType: 'element',
        attributes: data.attributes,
      });
    }
    if (data.type === 'text_delta') {
      const text = getPath(data.path)?.nodeValue || '';
      setPath(data.path, {
        nodeType: 'text',
        nodeValue: text + data.delta
      });
    }
    contentHtml.value = parseNodeToHTML();
    // content.value += delta;
  });
  eventSource.addEventListener('finished', () => {
    console.log('传输完成');
    eventSource.close();
  });
}
</script>

<template>
  <div class="container">
    <div class="sandbox">
      <!-- <textarea>{{ JSON.stringify(content, null, 2) }}</textarea> -->
      <div v-html="contentHtml"></div>
    </div>
    <div class="panel">
      <label>输入内容</label>
      <textarea v-model="resume">
      </textarea>
      <button @click="update">提交</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: start;
  width: 100%;
  height: 100vh;
  font-size: .85rem;
}

/* 左侧自适应 */
.sandbox {
  flex: 1;
  /* 占据剩余空间 */
  padding: 20px;
  height: 100vh;
  border-right: solid 1px #ccc;
  display: flex;
  text-align: start;
}

/* 右侧固定宽度 */
.panel {
  width: 300px;
  padding: 20px;
}

button {
  padding: 0 10px;
  margin-left: 6px;
}

textarea {
  width: 100%;
  height: 200px;
  font-size: 10px;
  flex-grow: 2;
}
</style>
