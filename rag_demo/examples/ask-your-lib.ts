import { SimpleRag } from '../src/index';
import ollama from 'ollama';

async function main() {
  const rag = new SimpleRag();
  await rag.initialize();
  const question = process.argv[process.argv.length - 1];
  const res = await rag.query(question);

  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant. Answer the question based on the context below. If the context does not contain the answer, say "I don't know". Do not make up an answer.\n\nContext:\n${JSON.stringify(res)}`,
    },
    { role: 'user', content: 'RAG Demo 是做什么的？' }
  ];

  const response = await ollama.chat({
    model: 'qwen3:1.7b',
    messages,
    stream: true
  });
  
  for await (const part of response) {
    process.stdout.write(part.message.content);
  }
}

main();