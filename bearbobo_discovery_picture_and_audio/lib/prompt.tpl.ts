export default `
分析图片内容，找出最能描述图片的一个英文单词，尽量选择更简单的A1~A2的词汇。

返回JSON数据：
{
  "representative_word": "图片代表的英文单词",
  "example_sentence": "结合英文单词和图片描述，给出一个简单的例句",
  "explainations": ["Look at the...", "", ""], // 用三句话描述图片代表的英文单词，第一句话以Look at the开头
  "explaination_replys": ["根据explaination给出的回复1", "根据explaination给出的回复2"]
}
`;