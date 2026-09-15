import { Module } from '@nestjs/common';
import { ToolService } from './tools.service';
import { DummyAnnotationToolsService } from './dummy-annotation-tools.service';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { version } from '../../package.json';

@Module({
  controllers: [],
  imports: [
    McpModule.forRoot({
      name: 'mcp-server',
      version,
      transport: [McpTransportType.STREAMABLE_HTTP],
    }),
  ],
  providers: [ToolService, DummyAnnotationToolsService],
})
export class C8yMcpModule {}
