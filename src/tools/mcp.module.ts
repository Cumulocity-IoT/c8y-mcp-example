import { Module } from '@nestjs/common';
import { ToolService } from './tools.service';
import { McpModule } from '@rekog/mcp-nest';
import { version } from '../../package.json';

@Module({
  controllers: [],
  imports: [
    McpModule.forRoot({
      name: 'mcp-server',
      version,
    }),
  ],
  providers: [ToolService],
})
export class C8yMcpModule {}
