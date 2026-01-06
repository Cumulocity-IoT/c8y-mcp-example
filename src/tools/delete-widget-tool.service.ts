import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';

// Schema definitions for delete widget tool
const DeleteWidgetParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  widgetId: z.string().describe('ID of the widget to delete'),
});

type DeleteWidgetParamsType = z.infer<typeof DeleteWidgetParams>;

@Injectable()
export class DeleteWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${DeleteWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-delete-widget',
    description:
      'Deletes a widget from the specified dashboard by removing it from the dashboard configuration.',
    parameters: DeleteWidgetParams,
  })
  async deleteWidget(
    params: DeleteWidgetParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `deleteWidget called with params: ${JSON.stringify(params)}`,
    );

    const client = request.userClient;

    const dashboard = await client.inventory.detail(params.dashboardId);

    if (!dashboard.data.c8y_Dashboard?.children) {
      return {
        content: [
          {
            type: 'text',
            text: 'Dashboard has no widgets to delete.',
          },
        ],
      };
    }

    const widgetExists = params.widgetId in dashboard.data.c8y_Dashboard.children;

    if (!widgetExists) {
      return {
        content: [
          {
            type: 'text',
            text: `Widget with ID "${params.widgetId}" not found in dashboard.`,
          },
        ],
      };
    }

    // Delete the widget by removing it from the children object
    delete dashboard.data.c8y_Dashboard.children[params.widgetId];

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: `Widget "${params.widgetId}" successfully deleted from dashboard.`,
        },
      ],
    };
  }
}
