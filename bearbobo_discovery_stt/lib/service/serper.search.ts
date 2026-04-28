import axios from 'axios';
import TurndownService from 'turndown';

const turndown = new TurndownService().addRule('notLink', {
  filter: ['a'],
  replacement: function (content) {
    return '';
  },
});
turndown.remove(['script', 'meta', 'style', 'link', 'head', 'a']);

export async function search(topic: string) {
  const query = JSON.stringify({
    q: topic,
    location: 'China',
    gl: 'cn',
    hl: 'zh-cn',
    num: 5,
  });

  const payload = {
    method: 'post',
    url: 'https://google.serper.dev/search',
    headers: {
      'X-API-KEY': process.env.VITE_SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    data: query,
  };

  const { data } = await axios(payload);

  // console.log('search result:', data);

  let searchResult = '';
  if (data.answerBox) {
    searchResult += `${data.answerBox.snippet}\n\n${data.answerBox.snippetHighlighted?.join('\n')}\n\n`;
  }
  if (data.organic) {
    data.organic.forEach((result: any) => {
      searchResult += `## ${result.title}\n${result.snippet}\n\n`;
    });
  }

  if (topic.includes('site:')) {
    let url = topic.split('site:')[1];
    if (!/^http(s)?:\/\//.test(url)) {
      url = 'https://' + url.replace(/^\/\//, '');
    }
    const response = await axios.get(url);
    const content = turndown.turndown(response.data);
    if (content) {
      searchResult += `##原文\n\n${content}\n\n`;
    }
  }

  return { query: topic, result: searchResult };
}
