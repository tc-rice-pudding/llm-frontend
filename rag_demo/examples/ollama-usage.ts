import ollama from 'ollama';

async function main() {
  const res = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: 'RAG 是什么？'
  })
  
  console.log(res) // 就是向量数组啦～
}

main();