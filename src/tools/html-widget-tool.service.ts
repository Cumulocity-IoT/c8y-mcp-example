import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

// Schema definitions for HTML widget tool
const PathProperty = z.object({
  name: z.string().describe('Name of the property'),
  path: z.string().describe('Path to the property value'),
});

const ComputedProperty = z.object({
  name: z.string().describe('Name of the computed property'),
  query: z.string().describe('Query to compute the property value'),
  reducer: z.string().optional().describe('Reducer function for the query'),
});

const HtmlWidgetOptions = z.object({
  cssEncapsulation: z
    .boolean()
    .describe('Whether to encapsulate CSS styles'),
  advancedSecurity: z
    .boolean()
    .describe('Whether to enable advanced security features'),
});

const HtmlWidgetDefinition = z.object({
  css: z.string().describe('CSS styles for the widget'),
  code: z.string().describe('HTML/JavaScript code for the widget'),
  props: z
    .array(z.union([PathProperty, ComputedProperty]))
    .optional()
    .describe('Array of properties (path or computed)'),
  options: HtmlWidgetOptions.describe('Widget options for security and styling'),
  legacy: z.boolean().describe('Whether to use legacy mode'),
  devMode: z.boolean().describe('Whether development mode is enabled'),
  latestCodeHash: z
    .string()
    .optional()
    .describe('Hash of the latest code version'),
});

const HtmlWidgetParams = z.object({
  dashboardId: z.string().describe('ID of the dashboard'),
  title: z.string().describe('Title of the widget'),
  x: z.number().describe('X position of the widget on the dashboard'),
  y: z.number().describe('Y position of the widget on the dashboard'),
  width: z.number().describe('Width of the widget'),
  height: z.number().describe('Height of the widget'),
  widgetDefinition: HtmlWidgetDefinition.describe(
    'Widget definition containing HTML, CSS, and configuration options',
  ),
});

type HtmlWidgetParamsType = z.infer<typeof HtmlWidgetParams>;

@Injectable()
export class HtmlWidgetTool {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${HtmlWidgetTool.name}`);
  }

  @Tool({
    name: 'c8y-create-html-widget',
    description:
      `Creates a custom HTML widget on the specified dashboard with HTML, CSS, and JavaScript code.
      
      Use CSS vars for branding like:
      span.branded { 
        color: var(--brand-primary, var(--c8y-brand-primary)); 
      }
        
      The following branding vars are available:
--c8y-brand-dark
--c8y-brand-light
--c8y-brand-primary
--c8y-brand-10
--c8y-brand-20
--c8y-brand-30
--c8y-brand-40
--c8y-brand-50
--c8y-brand-60
--c8y-brand-70
--c8y-brand-80
--palette-status-danger-dark
--palette-status-danger-light
--palette-status-danger
--palette-status-info-dark
--palette-status-info-light
--palette-status-info
--palette-status-realtime
--palette-status-success-dark
--palette-status-success-light
--palette-status-success
--palette-status-system
--palette-status-warning-dark
--palette-status-warning-high
--palette-status-warning-light
--palette-status-warning

    Important: If JS is used, enable the advancedDeveloper mode and do a lit element webcomponent (while c8yContext is
    the current device context). You can import { fetch } from 'fetch'; to do http calls within the widget code.)

    A sample code snippet to get you started:

import { LitElement, html, css } from 'lit';
import { styleImports } from 'styles';

export default class DefaultWebComponent extends LitElement {
  static styles = css\`
    
:host > div {
  padding: var(--c8y-root-component-padding-default);
}
span.branded { 
  color: var(--brand-primary, var(--c8y-brand-primary)); 
}
  \`;

  static properties = {
    // The managed object this widget is assigned to. Can be null.
    c8yContext: { type: Object },
  };

  constructor() {
    super();
  }

  render() {
    return html\`
      <style>
        \${styleImports}
      </style>
      <div>
  <h2>Hello from <span class="branded">HTML widget</span></h2>
  <p class="m-b-8 m-t-16">
    You can use HTML and Javascript template literals here: <br>
  \${this.c8yContext ? this.c8yContext.name : 'No device selected'}
  </p>

  <a class="btn btn-primary m-b-16" href="#/group">Go to groups</a>

  <p>
    Use the CSS editor to customize the CSS. You can use <span class="text-bold">any design-token CSS variable</span> in
    there.
  </p>
</div>
    \`;
  }
}

      `,
    parameters: HtmlWidgetParams,
  })
  async createHtmlWidget(
    params: HtmlWidgetParamsType,
    _context: Context,
    request: Request,
  ): Promise<any> {
    this.logger.log(
      `createHtmlWidget called with params: ${JSON.stringify(params)}`,
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
        config: {
            config: params.widgetDefinition,
        },
        title: params.title,
        componentId: 'Html widget',
        id: widgetId,
        classes: {
          card: true,
          'card-dashboard': true,
          'html-widget': true,
          "panel-title-hidden": true,
        },
      },
    };

    await client.inventory.update(dashboard.data);

    return {
      content: [
        {
          type: 'text',
          text: 'HTML widget successfully added to dashboard.',
        },
      ],
    };
  }
}
