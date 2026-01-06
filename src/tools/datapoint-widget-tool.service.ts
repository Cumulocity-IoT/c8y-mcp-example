import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

// Schema definitions for datapoint widget tool
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

const IIdentified = z.object({
  id: z.union([z.string(), z.number()]),
});

const RenderType = z.enum(['area', 'max', 'min']);

const LineType = z.enum([
  'bars',
  'line',
  'linePoints',
  'points',
  'step-after',
  'step-before',
]);

const DatapointsGraphKPIDetails = z.object({
  fragment: z.string(),
  series: z.string(),
  orientation: z.union([z.string(), z.null()]).optional(),
  __target: z.union([IIdentified, z.null()]).describe('The device target of the datapoint'),
  __active: z.union([z.boolean(), z.null()]),
  __template: z.union([z.string(), z.number(), z.null()]).optional(),
  unit: z.union([z.string(), z.null()]).describe('Unit of measurement for the datapoint'),
  min: z.union([z.number(), z.null()]),
  color: z.union([z.string(), z.null()]).describe('Color for the datapoint'),
  max: z.union([z.number(), z.null()]).optional(),
  label: z.union([z.string(), z.null()]).optional().describe('Label for the datapoint'),
  yellowRangeMax: z.union([z.number(), z.null()]).optional(),
  yellowRangeMin: z.union([z.number(), z.null()]).optional(),
  redRangeMin: z.union([z.number(), z.null()]).optional(),
  redRangeMax: z.union([z.number(), z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  renderType: RenderType,
  lineType: LineType,
  yAxisType: z.union([z.string(), z.null()])
});

const SelectedDatapoint = z.object({
  target: z.string().optional(),
  series: z.string().optional(),
  fragment: z.string().optional(),
});

const AlarmFilters = z.object({
  type: z.string(),
});

const AlarmSeverity = z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING']);

const AlarmStatus = z.enum(['ACKNOWLEDGED', 'ACTIVE', 'CLEARED']);

const AlarmDetailsExtended = z.object({
  timelineType: z.literal('ALARM'),
  color: z.string(),
  __active: z.boolean().optional(),
  label: z.string(),
  filters: AlarmFilters,
  __target: IIdentified,
  selectedDatapoint: SelectedDatapoint.optional(),
  __hidden: z.boolean().optional(),
  __severity: z.array(AlarmSeverity).optional(),
  __status: z.array(AlarmStatus).optional(),
});

const EventFilters = z.object({
  type: z.string(),
});

const EventDetailsExtended = z.object({
  timelineType: z.literal('EVENT'),
  color: z.string(),
  __active: z.boolean().optional(),
  label: z.string(),
  filters: EventFilters,
  __target: IIdentified,
  selectedDatapoint: SelectedDatapoint.optional(),
  __hidden: z.boolean().optional(),
});

const AlarmOrEventExtended = z.union([
  AlarmDetailsExtended,
  EventDetailsExtended,
]);

const AggregationType = z.enum(['DAILY', 'HOURLY', 'MINUTELY']);

const RefreshOption = z.enum(['history', 'live']);

const DisplayMode = z.enum(['config', 'dashboard', 'view_and_config']);

const DatapointWidgetDefinition = z.object({
  activeAlarmTypesOutOfRange: z.array(z.string()).optional(),
  aggregatedDatapoint: DatapointsGraphKPIDetails.optional(),
  alarmsEventsConfigs: z.array(AlarmOrEventExtended).optional(),
  datapoints: z
    .union([z.array(DatapointsGraphKPIDetails), z.null()])
    .describe('Array of datapoint configurations'),
  date: DateTimeContext.optional(),
  dateFrom: z
    .union([z.string().datetime(), z.string(), z.null()])
    .optional()
    .describe('Start date for data retrieval'),
  dateTo: z
    .union([z.string().datetime(), z.string(), z.null()])
    .optional()
    .describe('End date for data retrieval'),
  displayAggregationSelection: z.union([z.boolean(), z.null()]).optional(),
  displayDateSelection: z.union([z.boolean(), z.null()]).optional(),
  displayMarkedLine: z.boolean().optional(),
  displayMarkedPoint: z.boolean().optional(),
  mergeMatchingDatapoints: z
    .boolean()
    .optional()
    .describe('Whether to merge matching datapoints'),
  forceMergeDatapoints: z
    .boolean()
    .optional()
    .describe('Force merge datapoints'),
  realtime: z.union([z.boolean(), z.null()]).optional(),
  showLabelAndUnit: z.boolean().optional(),
  showSlider: z.union([z.boolean(), z.null()]).optional(),
  sliderChange: z.union([z.boolean(), z.null()]).optional(),
  xAxisSplitLines: z.union([z.boolean(), z.null()]).optional(),
  yAxisSplitLines: z.union([z.boolean(), z.null()]).optional(),
  interval: TimeInterval.optional(),
  dateTimeContext: DateTimeContext.optional().describe(
    'Date and time range context',
  ),
  aggregation: z
    .union([AggregationType, z.null()])
    .optional()
    .describe('Aggregation type for data'),
  refreshOption: RefreshOption.optional().describe(
    'Refresh option (history or live)',
  ),
  isAutoRefreshEnabled: z
    .boolean()
    .optional()
    .describe('Whether auto-refresh is enabled'),
  isRealtimeEnabled: z
    .boolean()
    .optional()
    .describe('Whether real-time updates are enabled'),
  displayMode: DisplayMode.optional().describe('Display mode for the widget'),
  refreshInterval: z
    .number()
    .optional()
    .describe('Refresh interval in milliseconds'),
  numberOfDecimalPlaces: z
    .number()
    .optional()
    .describe('Number of decimal places to display'),
});

const DatapointWidgetParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  title: z.string().describe('Title of the widget'),
  x: z.number().describe('X position of the widget on the dashboard'),
  y: z.number().describe('Y position of the widget on the dashboard'),
  width: z.number().describe('Width of the widget'),
  height: z.number().describe('Height of the widget'),
  widgetDefinition: DatapointWidgetDefinition.describe(
    'Widget definition containing datapoint configuration and display options',
  ),
});

type DatapointWidgetParamsType = z.infer<typeof DatapointWidgetParams>;

@Injectable()
export class DatapointWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${DatapointWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-create-datapoint-widget',
    description:
      'Creates a datapoint graph widget on the specified dashboard with given configuration.',
    parameters: DatapointWidgetParams,
  })
  async createDatapointWidget(
    params: DatapointWidgetParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `createDatapointWidget called with params: ${JSON.stringify(params)}`,
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
        componentId: 'Data points graph 2',
        id: widgetId,
        classes: {
          card: true,
          'card-dashboard': true,
          'datapoint-graph': true,
          'panel-title-regular': true,
        },
      },
    };

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: 'Datapoint widget successfully added to dashboard.',
        },
      ],
    };
  }
}
