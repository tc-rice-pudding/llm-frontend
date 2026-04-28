/**
 * 项目通用类型定义
 * @description 包含项目中使用的所有类型定义
 * @author RAG Demo Project
 * @version 1.0.0
 */

export interface IEmbedding {
  metadata: { text: string };
  vector: number[];
}