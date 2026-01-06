import { Module } from '@nestjs/common';
import { AlarmsWidgetTool } from './alarms-widget-tool.service';
import { McpModule } from '@rekog/mcp-nest';
import { version } from '../../package.json';
import { ConfigurationService } from 'src/config/configuration.service';
import { DatapointWidgetTool } from './datapoint-widget-tool.service';
import { HtmlWidgetTool } from './html-widget-tool.service';
import { KpiWidgetTool } from './kpi-widget-tool.service';
import { RadialGaugeWidgetTool } from './radial-gauge-widget-tool.service';
import { DeleteWidgetTool } from './delete-widget-tool.service';
@Module({
  controllers: [],
  imports: [
    McpModule.forRoot({
      name: 'mcp-server',
      globalApiPrefix: ConfigurationService.getBasePath(),
      version,
    }),
  ],
  providers: [
    AlarmsWidgetTool,
    DatapointWidgetTool,
    HtmlWidgetTool,
    KpiWidgetTool,
    RadialGaugeWidgetTool,
    DeleteWidgetTool
  ],
})
export class C8yMcpModule {}
