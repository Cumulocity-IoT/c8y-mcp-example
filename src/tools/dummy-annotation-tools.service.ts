import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

type EmptyParams = Record<string, never>;

/**
 * Dummy tools exercising the MCP tool-annotation combinations relevant to the
 * HITL approval-policy work (c8y-ai-agents PR #793 exposes `Tool.annotations`
 * through the tools API, PR #795 derives an "approval required" preview from
 * `destructiveHint`/`readOnlyHint`/`openWorldHint`). None of these do
 * anything real - they only exist so those PRs can be tested against a live
 * MCP server with every annotation combination represented.
 */
@Injectable()
export class DummyAnnotationToolsService {
  protected readonly logger: Logger;

  constructor() {
    this.logger = new Logger(`${DummyAnnotationToolsService.name}`);
  }

  private echo(toolName: string, params: EmptyParams): { message: string } {
    this.logger.log(
      `${toolName} called with params: ${JSON.stringify(params)}`,
    );
    return { message: `${toolName} executed.` };
  }

  @Tool({
    name: 'c8y-dummy-read-only',
    description:
      'Dummy tool: fully safe read (readOnlyHint=true, destructiveHint=false, openWorldHint=false). No approval criterion should trigger.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Read Only',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  })
  readOnly(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-read-only', params);
  }

  @Tool({
    name: 'c8y-dummy-read-only-open-world',
    description:
      'Dummy tool: read-only but reaches external systems (readOnlyHint=true, openWorldHint=true). Isolates the "open world" approval criterion.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Read Only, Open World',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  })
  readOnlyOpenWorld(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-read-only-open-world', params);
  }

  @Tool({
    name: 'c8y-dummy-write-safe',
    description:
      'Dummy tool: non-destructive local write (readOnlyHint=false, destructiveHint=false, openWorldHint=false). Isolates the "non read-only" approval criterion.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Safe Write',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  })
  writeSafe(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-write-safe', params);
  }

  @Tool({
    name: 'c8y-dummy-write-safe-open-world',
    description:
      'Dummy tool: non-destructive write reaching external systems (readOnlyHint=false, destructiveHint=false, openWorldHint=true).',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Safe Write, Open World',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  })
  writeSafeOpenWorld(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-write-safe-open-world', params);
  }

  @Tool({
    name: 'c8y-dummy-destructive',
    description:
      'Dummy tool: destructive local write (readOnlyHint=false, destructiveHint=true, openWorldHint=false).',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Destructive',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  })
  destructive(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-destructive', params);
  }

  @Tool({
    name: 'c8y-dummy-destructive-open-world',
    description:
      'Dummy tool: worst case (readOnlyHint=false, destructiveHint=true, openWorldHint=true). All three approval criteria should trigger.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Destructive, Open World',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  })
  destructiveOpenWorld(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-destructive-open-world', params);
  }

  @Tool({
    name: 'c8y-dummy-no-annotations',
    description:
      'Dummy tool: declares no annotations at all. Per the MCP spec, consumers must treat missing hints as the worst case (not read-only, destructive, open-world) - this should behave like c8y-dummy-destructive-open-world.',
    parameters: z.object({}),
  })
  noAnnotations(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-no-annotations', params);
  }

  @Tool({
    name: 'c8y-dummy-read-only-destructive-contradiction',
    description:
      'Dummy tool: contradictory hints (readOnlyHint=true AND destructiveHint=true). destructiveHint is only meaningful when readOnlyHint=false, so readOnlyHint should win and neither the destructive nor the non-read-only criterion should trigger.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Contradictory Hints',
      readOnlyHint: true,
      destructiveHint: true,
      openWorldHint: false,
    },
  })
  readOnlyDestructiveContradiction(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-read-only-destructive-contradiction', params);
  }

  @Tool({
    name: 'c8y-dummy-malformed-hints',
    description:
      'Dummy tool: hints declared with the wrong type (strings/numbers/null instead of booleans), as an untrusted server might send. Consumers should compare strictly and treat anything that is not exactly `true`/`false` as the safe, approval-requiring side.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Malformed Hints',
      readOnlyHint: 'true' as unknown as boolean,
      destructiveHint: 1 as unknown as boolean,
      openWorldHint: null as unknown as boolean,
    },
  })
  malformedHints(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-malformed-hints', params);
  }

  @Tool({
    name: 'c8y-dummy-custom-title',
    description:
      'Dummy tool: fully safe, but declares a human-friendly `title` annotation distinct from its tool name.',
    parameters: z.object({}),
    annotations: {
      title: 'Friendly Display Name',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  })
  customTitle(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-custom-title', params);
  }
}
