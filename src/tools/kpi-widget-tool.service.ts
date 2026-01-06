import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

// Schema definitions for KPI widget tool
const IIdentified = z.object({
  id: z.union([z.string(), z.number()]),
});

const KPIDetails = z.object({
  fragment: z.string().describe('Fragment name for the measurement'),
  series: z.string().describe('Series name for the measurement'),
  orientation: z.union([z.string(), z.null()]).optional(),
  __target: z.union([IIdentified, z.null()]).optional(),
  __active: z.union([z.boolean(), z.null()]).optional(),
  __template: z.union([z.string(), z.number(), z.null()]).optional(),
  unit: z.union([z.string(), z.null()]).optional(),
  min: z.union([z.number(), z.null()]).optional(),
  color: z.union([z.string(), z.null()]).optional(),
  max: z.union([z.number(), z.null()]).optional(),
  label: z.union([z.string(), z.null()]).optional(),
  target: z.union([z.number(), z.null()]).optional(),
  yellowRangeMax: z.union([z.number(), z.null()]).optional(),
  yellowRangeMin: z.union([z.number(), z.null()]).optional(),
  redRangeMin: z.union([z.number(), z.null()]).optional(),
  redRangeMax: z.union([z.number(), z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  renderType: z.union([z.string(), z.null()]).optional(),
  lineType: z.union([z.string(), z.null()]).optional(),
  yAxisType: z.union([z.string(), z.null()]).optional(),
});

// Icon enum - including all possible icon names
const IconName = z.enum([
  '120-degrees',
  '225-degrees',
  '300-degrees',
  '360-degrees',
  '3fr',
  '60-degrees',
  '7zip',
  'aac',
  'access',
  'accessibility',
  'accessibility-settings',
  'account-disable',
  'account-enable',
  'accounting',
  'accuracy',
  'activity-history',
  'add',
  'add-basket',
  'add-box',
  'add-circle-outline',
  'add-folder',
  'add-identity-provider',
  'add-new',
  'add-property',
  'add-receipt',
  'add-stage',
  'add-tag',
  'add-to-inbox',
  'add-user',
  'add-white-space',
  'address',
  'address-book',
  'address-book-o',
  'address-card',
  'address-card-o',
  'adjust',
  'adjust1',
  'advanced-search',
  'advertisement-page',
  'agreement',
  'ai',
  'air-conditioner',
  'air-quality',
  'air-shaft',
  'airport',
  'alarm',
  'alarm-add',
  'alarm-off',
  'alarm-on',
  'alarm1',
  'alarms',
  'c8y-device',
  'c8y-group',
  'calendar',
  'camera',
  'chart',
  'check',
  'clock',
  'cloud',
  'cog',
  'dashboard',
  'database',
  'device',
  'download',
  'edit',
  'file',
  'folder',
  'graph',
  'home',
  'info',
  'lightbulb-o',
  'map',
  'menu',
  'power-off',
  'search',
  'settings',
  'star',
  'thermometer',
  'upload',
  'user',
  'warning',
  'wifi',
  'wrench',
]);

const KpiWidgetDefinition = z.object({
  datapoints: z
    .array(KPIDetails)
    .describe('Array of KPI datapoint configurations'),
  icon: z
    .union([z.object({}), IconName, z.null()])
    .optional()
    .describe('Icon to display (icon name or null)'),
  showTimestamp: z
    .union([z.boolean(), z.null()])
    .optional()
    .describe('Whether to show timestamp'),
  showTrend: z
    .union([z.boolean(), z.null()])
    .optional()
    .describe('Whether to show trend indicator'),
  showIcon: z
    .union([z.boolean(), z.null()])
    .optional()
    .describe('Whether to show icon'),
  numberOfDecimalPlaces: z
    .union([z.number(), z.null()])
    .optional()
    .describe('Number of decimal places to display'),
  fontSize: z
    .union([z.number(), z.null()])
    .optional()
    .describe('Font size for the KPI value'),
});

const KpiWidgetParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  title: z.string().describe('Title of the widget'),
  x: z.number().describe('X position of the widget on the dashboard'),
  y: z.number().describe('Y position of the widget on the dashboard'),
  width: z.number().describe('Width of the widget'),
  height: z.number().describe('Height of the widget'),
  widgetDefinition: KpiWidgetDefinition.describe(
    'Widget definition containing KPI datapoint configurations and display options',
  ),
});

type KpiWidgetParamsType = z.infer<typeof KpiWidgetParams>;

@Injectable()
export class KpiWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${KpiWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-create-kpi-widget',
    description:
      'Creates a KPI (Key Performance Indicator) widget on the specified dashboard to display measurement values with optional icons, trends, and formatting.',
    parameters: KpiWidgetParams,
  })
  async createKpiWidget(
    params: KpiWidgetParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `createKpiWidget called with params: ${JSON.stringify(params)}`,
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
        componentId: 'kpi.widget',
        id: widgetId,
        classes: {
          card: true,
          'card-dashboard': true,
          'panel-title-regular': true,
        },
      },
    };

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: 'KPI widget successfully added to dashboard.',
        },
      ],
    };
  }
}
