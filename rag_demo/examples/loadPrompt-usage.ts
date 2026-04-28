import { loadPrompt } from '../src/mcp/utils';

(async () => {
  console.log(await loadPrompt('generate'));
})()