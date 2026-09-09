import { Controller, Get } from '@nestjs/common';
import { EXAMPLE_AGENT_DEFINITION } from './example-agent.definition';

@Controller('agents')
export class AgentsController {
  @Get('example-agent.json')
  getExampleAgent() {
    return EXAMPLE_AGENT_DEFINITION;
  }
}
