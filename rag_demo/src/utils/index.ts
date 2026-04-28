/**
 * 工具函数集合
 * @description 包含项目中使用的通用工具函数
 * @author RAG Demo Project
 * @version 1.0.0
 */

import ollama, { EmbeddingsResponse } from 'ollama';
import type { IEmbedding } from '../types';

function splitText(text: string, chunkSize = 300, overlap = 50): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize - overlap
  }
  return chunks
}

function getEmbedding(text: string): Promise<EmbeddingsResponse> {
  return ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: text
  });
}

export async function getEmbeddings(text: string): Promise<IEmbedding[]> {
  const chunks = splitText(text);
  
  const embeddings = await Promise.all(chunks.map(chunk => getEmbedding(chunk)));
  return embeddings.map((embedding, i) => ({
    vector: embedding.embedding,
    metadata: { text: chunks[i] }
  }));
}

export async function getVector(text: string): Promise<number[]> {
  return (await getEmbedding(text)).embedding;
}