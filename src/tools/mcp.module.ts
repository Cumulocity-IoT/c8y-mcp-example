import { Module } from '@nestjs/common';
import { ToolService } from './tools.service';
import { McpModule } from '@rekog/mcp-nest';
import { version } from '../../package.json';
import { ConfigurationService } from 'src/config/configuration.service';
@Module({
  controllers: [],
  imports: [
    McpModule.forRoot({
      name: 'mcp-server',
      globalApiPrefix: ConfigurationService.getBasePath(),
      version,
    }),
  ],
  providers: [ToolService],
})
export class C8yMcpModule {}
