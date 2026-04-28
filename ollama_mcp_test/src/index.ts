import { createClient } from './client';

(async () => {
  const client = await createClient();

  const result = await client.callTool({
    name:'node-version-detect', 
    arguments: {  }
  });

  console.log(result, JSON.stringify(await client.listTools()));
  // console.log(res);
  // console.log(client.getPrompt({
  //   name: "add",
  //   arguments: { a: "1", b: "2" },
  // }));
})()