import { EventEmitter } from 'node:events';
import { createClient } from '../mcp/client';
import axios from 'axios';

export class LLM {
  private mcpClient = createClient();

  constructor(private model: string, private base_url: string, private api_key: string | null = null) {

  }

  get headers(): { [key: string]: string } {
    if (this.api_key) {
      return {
        // 'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.api_key}`
      }
    } else {
      return {
        // 'Content-Type': 'application/json',
      }
    }
  }

  private async listTools() {
    return (await (await this.mcpClient).listTools()).tools.map((tool: any) => (
      {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        }
      }
    ));
  }

  private async callTool(tool_name: string, tool_args: any) {
    const result = await (await this.mcpClient).callTool({
      name: tool_name,
      arguments: tool_args
    });

    return {
      role: 'tool',
      name: tool_name,
      content: (result.content as any)[0].text,
    }
  }

  async chat(messages: any[]) {
    const tools = await this.listTools();

    const response = await axios.post(`${this.base_url}/api/chat`, {
      model: this.model,
      messages,
      tools,
      stream: false,
    }, {
      headers: this.headers
    });

    const data = response.data;
    // console.log(tools, JSON.stringify(data));
    // if tool_calls is not empty, call too
    const reply = data.message.content;

    const tool_calls = data.message.tool_calls;

    if(tool_calls && tool_calls.length > 0) {
      const results = await Promise.all(tool_calls.map(async (tool_call: any) => 
        this.callTool(tool_call.function.name, tool_call.function.arguments)));
      // console.log(results);
      return await this.chat([...messages, ...results]);
    }
    return reply;
  }

  async chatStream(messages: any[], emitter: EventEmitter = new EventEmitter()) {
    const response = await axios.post(`${this.base_url}/api/chat`, {
      model: this.model,
      messages,
      tools: await this.listTools(),
      stream: true,
    }, {
      responseType: 'stream',
      headers: this.headers
    });
    
    let hasToolcall = false;
    response.data.on('data', async (chunk: Buffer) => {
      try {
        const text = chunk.toString();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          // console.log(line);

          try {
            const parsed = JSON.parse(line);
            const tool_calls = parsed.message?.tool_calls;
            if (tool_calls && tool_calls.length > 0) {
              hasToolcall = true;
              emitter.emit('tool_call', tool_calls.map((tool_call: any) => tool_call.function.name));
              const results = await Promise.all(tool_calls.map(async (tool_call: any) => 
                this.callTool(tool_call.function.name, tool_call.function.arguments)));
              await this.chatStream([...messages,...results], emitter);
            } else {
              emitter.emit('data', parsed.message?.content);
            }
          } catch (error) {
            console.error('解析JSON出错:', error);
            emitter.emit('error', error);
          }
        }
      } catch (error) {
        console.error('处理流数据出错:', error);
        emitter.emit('error', error);
      }
    });

    response.data.on('end', () => {
      if (!hasToolcall) {
        emitter.emit('end');
      }
    });

    response.data.on('error', (error: any) => {
      emitter.emit('error', error);
    });

    return emitter;
  }
}