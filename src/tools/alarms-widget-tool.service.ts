import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

// Schema definitions for alarm tool
const AlarmOrderType = z.enum([
  'BY_ACTIVE',
  'BY_DATE_ASCENDING',
  'BY_DATE_DESCENDING',
  'BY_SEVERITY',
]);

const SeverityFilter = z.object({
  CRITICAL: z.boolean().optional(),
  MAJOR: z.boolean().optional(),
  MINOR: z.boolean().optional(),
  WARNING: z.boolean().optional(),
});

const AlarmStatusSettings = z.object({
  ACKNOWLEDGED: z.boolean(),
  CLEARED: z.boolean(),
  ACTIVE: z.boolean(),
});

const TimeInterval = z.enum([
  'custom',
  'days',
  'hours',
  'minutes',
  'months',
  'none',
  'weeks',
]);

const DateTimeContext = z.object({
  dateFrom: z.union([z.string().datetime(), z.string()]),
  dateTo: z.union([z.string().datetime(), z.string()]),
  interval: TimeInterval,
});

const DeviceInfo = z.object({
  id: z.string(),
  name: z.string(),
});

const AggregationType = z.enum(['DAILY', 'HOURLY', 'MINUTELY']);

const RefreshOption = z.enum(['history', 'live']);

const DisplayMode = z.enum(['config', 'dashboard', 'view_and_config']);

const Source = z.enum(['dashboard', 'widget']);

const WidgetDefinition = z.object({
  order: AlarmOrderType.describe('The order in which alarms should be sorted'),
  showAlarmsForChildren: z
    .boolean()
    .optional()
    .describe('Whether to show alarms for child devices'),
  device: z
    .union([DeviceInfo, z.null()])
    .optional()
    .describe('The device to filter alarms for'),
  severities: SeverityFilter.describe('Filter alarms by severity levels'),
  status: AlarmStatusSettings.describe(
    'Filter alarms by status (acknowledged, cleared, active)',
  ),
  types: z
    .array(z.string())
    .optional()
    .describe('Array of alarm types to filter'),
  isRealtime: z
    .boolean()
    .optional()
    .describe('Whether real-time updates are enabled'),
  realtime: z.boolean().optional().describe('Real-time mode flag'),
  widgetId: z.string().optional().describe('ID of the widget'),
  dateTimeContext: DateTimeContext.optional().describe(
    'Date and time range context for filtering alarms',
  ),
  aggregation: z
    .union([AggregationType, z.null()])
    .optional()
    .describe('Aggregation type for alarm data'),
  isAutoRefreshEnabled: z
    .boolean()
    .optional()
    .describe('Whether auto-refresh is enabled'),
  refreshInterval: z
    .number()
    .optional()
    .describe('Refresh interval in milliseconds'),
  refreshOption: RefreshOption.optional().describe(
    'Refresh option (history or live)',
  ),
  displayMode: DisplayMode.optional().describe('Display mode for the widget'),
  source: Source.optional().describe(
    'Source of the request (dashboard or widget)',
  ),
  eventSourceId: z.string().optional().describe('ID of the event source'),
  widgetInstanceGlobalAutoRefreshContext: z
    .boolean()
    .optional()
    .describe(
      'Indicates if instance of widget is bound to global auto refresh context',
    ),
});

const AlarmToolParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  title: z.string().describe('Title of the widget'),
  x: z.number().describe('X position of the widget on the dashboard'),
  y: z.number().describe('Y position of the widget on the dashboard'),
  width: z.number().describe('Width of the widget'),
  height: z.number().describe('Height of the widget'),
  widgetDefinition: WidgetDefinition.describe(
    'Widget definition containing alarm configuration and filtering options',
  ),
});

type AlarmToolParamsType = z.infer<typeof AlarmToolParams>;

@Injectable()
export class AlarmsWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${AlarmsWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-create-alarms-widget',
    description:
      'Creates an alarms widget on the specified dashboard with given configuration.',
    parameters: AlarmToolParams,
  })
  async createAlarmsWidget(
    params: AlarmToolParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `getAlarmsTool called with params: ${JSON.stringify(params)}`,
    );

    const client = request.userClient;

    const dashboard = await client.inventory.detail(params.dashboardId);

    const widgetId = randomUUID();

    dashboard.data.c8y_Dashboard.children = {
      ...dashboard.data.c8y_Dashboard.children,
      [widgetId]: {
        _x: params.x,
        _y: params.y,
        _width: params.width,
        _height: params.height,
        config: params.widgetDefinition,
        title: params.title,
        componentId: 'Alarm list',
        id: widgetId,
        classes: {
          card: true,
          'card-dashboard': true,
          'alarm-list': true,
          'panel-title-regular': true,
        },
      },
    };

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: 'Alarm widget successfully added to dashboard.',
        },
      ],
    };
  }
}
