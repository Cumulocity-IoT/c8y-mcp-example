import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class ToolService {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${ToolService.name}`);
  }

  @Tool({
    name: 'c8y-hello-world',
    description: 'A simple tool that returns a hello world message.',
    parameters: z
      .object({
        name: z.string().describe('The name to greet.'),
      })
      .required(),
  })
  async helloWorldTool(
    params: { name: string },
    _context: Context,
  ): Promise<{ message: string }> {
    this.logger.log(
      `helloWorldTool called with params: ${JSON.stringify(params)}`,
    );
    return { message: `Hello, ${params.name}!` };
  }
}
