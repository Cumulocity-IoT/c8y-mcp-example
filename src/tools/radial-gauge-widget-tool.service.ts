import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

// Schema definitions for radial gauge widget tool
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

const GaugeOptions = z.object({
  name: z.string().optional().describe('Name of the gauge preset'),
  radius: z.string().optional().describe("Radius of the gauge (e.g., '90%')"),
  center: z
    .array(z.string())
    .optional()
    .describe("Center of the gauge (e.g., ['50%', '50%'])"),
  startAngle: z.number().optional().describe('Starting angle of the gauge'),
  endAngle: z.number().optional().describe('Ending angle of the gauge'),
  splitNumber: z
    .number()
    .optional()
    .describe('Number of segments in the gauge'),
  splitLineLength: z
    .union([z.string(), z.number()])
    .optional()
    .describe(
      'Length of the split line, can be a percentage value relative to radius',
    ),
  splitLineLengthRatio: z
    .number()
    .optional()
    .describe(
      'Length of the split line as a ratio relative to the axisLineWidth',
    ),
  splitLineDistance: z
    .number()
    .optional()
    .describe('Distance between the split line and axis line'),
  splitLineDistanceRatio: z
    .number()
    .optional()
    .describe(
      'Distance between the split line and axis line as a ratio relative to the axisLineWidth',
    ),
  splitLineColor: z
    .string()
    .optional()
    .describe('Color of the split lines (used only in the custom preset)'),
  splitLineWidth: z.number().optional().describe('Width of the split lines'),
  tickShow: z.boolean().optional().describe('Whether to show ticks'),
  tickWidth: z.number().optional().describe('Width of the ticks'),
  tickColor: z
    .string()
    .optional()
    .describe('Color of the ticks (used only in the custom preset)'),
  tickDistance: z
    .number()
    .optional()
    .describe('Distance of the ticks from the center'),
  tickDistanceRatio: z
    .number()
    .optional()
    .describe(
      'Distance of the ticks from the center as a ratio relative to the axisLineWidth',
    ),
  tickLength: z.number().optional().describe('Length of the ticks'),
  tickLengthRatio: z
    .number()
    .optional()
    .describe(
      'Length of the ticks as a ratio relative to the axisLineWidth',
    ),
  axisLabelDistance: z
    .number()
    .optional()
    .describe('Distance of the axis labels from the center'),
  axisLabelDistanceRatio: z
    .number()
    .optional()
    .describe(
      'Distance of the axis labels from the center as a ratio relative to the axisLineWidth',
    ),
  axisLabelColor: z
    .string()
    .optional()
    .describe('Color of the axis labels (used only in the custom preset)'),
  axisLabelFontSize: z
    .number()
    .optional()
    .describe('Font size of the axis labels'),
  axisLabelFontSizeRatio: z
    .number()
    .optional()
    .describe(
      'Font size of the axis labels as a ratio relative to the container size',
    ),
  axisLabelFontSizeMin: z
    .number()
    .optional()
    .describe('Minimum font size of the axis labels'),
  axisLabelFontSizeMax: z
    .number()
    .optional()
    .describe('Maximum font size of the axis labels'),
  axisLineWidth: z.number().optional().describe('Width of the axis line'),
  axisLineWidthRatio: z
    .number()
    .optional()
    .describe(
      'Width of the axis line as a ratio relative to the container size',
    ),
  showPointer: z.boolean().optional().describe('Whether to show the pointer'),
  pointerStyle: z
    .string()
    .optional()
    .describe('Style of the pointer (e.g., custom path)'),
  pointerColor: z
    .string()
    .optional()
    .describe('Color of the pointer (used only in the custom preset)'),
  pointerWidth: z
    .union([z.string(), z.number()])
    .optional()
    .describe('Width of the pointer'),
  pointerWidthRatio: z
    .number()
    .optional()
    .describe(
      'Width of the pointer as a ratio relative to the container size',
    ),
  pointerLength: z
    .union([z.string(), z.number()])
    .optional()
    .describe('Length of the pointer'),
  pointerLenghtRatio: z
    .number()
    .optional()
    .describe(
      'Length of the pointer as a ratio relative to the container size',
    ),
  pointerOffset: z
    .union([z.string(), z.number()])
    .optional()
    .describe('Offset of the pointer from the center'),
  progressBar: z.boolean().optional().describe('Whether to show a progress bar'),
  progressBarWidth: z.number().optional().describe('Width of the progress bar'),
  progressBarRoundCap: z
    .boolean()
    .optional()
    .describe('Whether the progress bar has rounded caps'),
  progressBarColor: z.string().optional().describe('Color of the progress bar'),
  additionalGaugeColors: z
    .array(z.string())
    .optional()
    .describe('Additional colors for the gauge'),
  measurementValueFontRatio: z
    .number()
    .optional()
    .describe('Font size of the measurement value'),
  measurementValueFontMin: z
    .number()
    .optional()
    .describe('Minimum font size of the measurement value'),
  measurementValueFontMax: z
    .number()
    .optional()
    .describe('Maximum font size of the measurement value'),
  measurementValueColor: z
    .string()
    .optional()
    .describe('Color of the measurement value'),
  unitFontSize: z.number().optional().describe('Font size of the unit'),
  unitFontRatio: z
    .number()
    .optional()
    .describe(
      'Font size of the unit as a ratio relative to the container size',
    ),
  unitFontMin: z.number().optional().describe('Minimum font size of the unit'),
  unitFontMax: z.number().optional().describe('Maximum font size of the unit'),
  unitColor: z.string().optional().describe('Color of the unit'),
  dateFontSize: z.number().optional().describe('Font size of the date'),
  dateFontRatio: z
    .number()
    .optional()
    .describe(
      'Font size of the date as a ratio relative to the container size',
    ),
  dateFontMin: z.number().optional().describe('Minimum font size of the date'),
  dateFontMax: z.number().optional().describe('Maximum font size of the date'),
  dateColor: z.string().optional().describe('Color of the date'),
  showDetail: z
    .boolean()
    .optional()
    .describe('Whether to show detailed information'),
  valueFontSize: z
    .number()
    .optional()
    .describe('Font size of the value displayed'),
  detailOffsetCenter: z
    .union([z.array(z.string()), z.array(z.number())])
    .optional()
    .describe('Offset of the detail from the center'),
  showMarkPoint: z
    .boolean()
    .optional()
    .describe('Whether to show mark points'),
});

const RadialGaugeWidgetDefinition = z.object({
  datapoints: z
    .array(KPIDetails)
    .optional()
    .describe('Array of datapoint configurations'),
  datapointsLabels: z
    .array(KPIDetails)
    .optional()
    .describe('Array of datapoint configurations for labels'),
  datapointsGauge: z
    .array(KPIDetails)
    .optional()
    .describe('Array of datapoint configurations for gauge'),
  selectedPresetId: z
    .string()
    .optional()
    .describe('ID of the selected preset'),
  gaugeOptions: GaugeOptions.optional().describe(
    'Gauge configuration options for appearance and behavior',
  ),
  fractionSize: z
    .number()
    .describe('Number of decimal places to display in values'),
});

const RadialGaugeWidgetParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  title: z.string().describe('Title of the widget'),
  x: z.number().describe('X position of the widget on the dashboard'),
  y: z.number().describe('Y position of the widget on the dashboard'),
  width: z.number().describe('Width of the widget'),
  height: z.number().describe('Height of the widget'),
  widgetDefinition: RadialGaugeWidgetDefinition.describe(
    'Widget definition containing radial gauge configuration and display options',
  ),
});

type RadialGaugeWidgetParamsType = z.infer<typeof RadialGaugeWidgetParams>;

@Injectable()
export class RadialGaugeWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${RadialGaugeWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-create-radial-gauge-widget',
    description:
      'Creates a radial gauge widget on the specified dashboard to display measurements in a circular gauge with customizable appearance, pointers, progress bars, and colors.',
    parameters: RadialGaugeWidgetParams,
  })
  async createRadialGaugeWidget(
    params: RadialGaugeWidgetParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `createRadialGaugeWidget called with params: ${JSON.stringify(params)}`,
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
        componentId: 'KPI Radial Gauge',
        id: widgetId,
        classes: {
          card: true,
          'card-dashboard': true,
          'radial-gauge': true,
          'panel-title-regular': true,
        },
      },
    };

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: 'Radial gauge widget successfully added to dashboard.',
        },
      ],
    };
  }
}
