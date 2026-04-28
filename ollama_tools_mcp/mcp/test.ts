import { createClient } from './client';

const client = await createClient();

const result = await client.callTool({
  name:'listFiles', 
  arguments: { path: '.' }
});

console.log('Server 提供的 tools：');
console.log(JSON.stringify(await client.listTools(), null, 2));
console.log('\n\n调用 listFiles：');
console.log(result);
