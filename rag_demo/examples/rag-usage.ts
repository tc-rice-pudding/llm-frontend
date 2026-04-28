import { SimpleRag } from '../src/index';

async function main() {
  const rag = new SimpleRag();
  await rag.initialize();
  const inserted = await rag.add('RAG 技术原理');
  console.log(JSON.stringify(inserted));
  const res = await rag.query('RAG 是什么？');
  console.log(JSON.stringify(res));
  const res2 = await rag.query('随便问一些无关内容');
  console.log(JSON.stringify(res2));
  await rag.del(inserted);
}

main();