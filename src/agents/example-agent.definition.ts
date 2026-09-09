/**
 * Example agent definition exposed by this microservice.
 *
 * Cumulocity AI Agents discovers this agent through the `agents` map in
 * `manifest.json`, which points to the path this definition is served at
 * (`agents/example-agent.json`, exposed by `AgentsController`). See the
 * `AgentBaseDefinition` type in `@c8y/ai-types` for the full schema.
 */
export const EXAMPLE_AGENT_DEFINITION = {
  name: 'example-agent',
  type: 'text',
  availability: 'SHARED',
  mcp: [
    {
      serverName: 'mcp-example-http-exposed-server',
      tools: ['c8y-hello-world-http'],
    },
  ],
  agent: {
    system:
      'You are a friendly example assistant bundled with the Cumulocity MCP example microservice. ' +
      'When a user asks for a greeting, call the c8y-hello-world-http tool with their name and reply with its message.',
    temperature: 0.3,
  },
};
