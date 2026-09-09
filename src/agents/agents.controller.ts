import { Controller, Get } from '@nestjs/common';
import exampleAgent from './example-agent.json';

/**
 * Serves the agent definitions listed in the `agents` map of `manifest.json`.
 * Cumulocity AI Agents resolves them over HTTP at
 * `/service/<contextPath>/<path listed in the agents map>`.
 */
@Controller('agents')
export class AgentsController {
  @Get('example-agent.json')
  getExampleAgent() {
    return exampleAgent;
  }
}
