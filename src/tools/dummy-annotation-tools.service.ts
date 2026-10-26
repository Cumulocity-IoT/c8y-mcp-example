import { Injectable, Logger } from '@nestjs/common';
import { Context, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';

type EmptyParams = Record<string, never>;

/**
 * Dummy tools exercising the MCP tool-annotation combinations relevant to user
 * approval of tool calls in c8y-ai-agents (#793 makes approval opt-out and
 * exposes `Tool.annotations` through the tools API, #795 configures it on an
 * agent's Tools tab). None of these do anything real - they only exist so
 * those PRs can be tested against a live MCP server with every annotation
 * combination represented.
 *
 * Each description states what to expect: the tags on the Tools tab, whether
 * a call asks for approval when the agent has no approval settings, and the
 * mode "Override for this tool" starts at.
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
      'Dummy tool: read-only, closed-world. Expect tag "Read-only"; runs without approval by default; override starts at Never.',
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
      'Dummy tool: read-only but open-world. Expect tags "Read-only" and "External systems"; asks for approval by default; override starts at Always.',
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
    name: 'c8y-dummy-read-only-open-world-undeclared',
    description:
      'Dummy tool: declares only readOnlyHint=true, so the missing openWorldHint counts as open-world. Expect tags "Read-only" and "External systems"; asks for approval by default; override starts at Always.',
    parameters: z.object({}),
    annotations: {
      title: 'Dummy - Read Only, Open World Undeclared',
      readOnlyHint: true,
    },
  })
  readOnlyOpenWorldUndeclared(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-read-only-open-world-undeclared', params);
  }

  @Tool({
    name: 'c8y-dummy-write-safe',
    description:
      'Dummy tool: non-destructive write, closed-world. Expect tag "Changes data"; asks for approval by default; override starts at If risky, which lets it run without approval.',
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
      'Dummy tool: non-destructive write, open-world. Expect tags "Changes data" and "External systems"; asks for approval by default; override starts at Always.',
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
      'Dummy tool: destructive write, closed-world. Expect tag "Destructive"; asks for approval by default; override starts at Always.',
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
      'Dummy tool: destructive write, open-world (worst case). Expect tags "Destructive" and "External systems"; asks for approval by default; override starts at Always.',
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
      'Dummy tool: declares no annotations, so missing hints count as the worst case. Expect tag "Not declared"; asks for approval by default; override starts at Always.',
    parameters: z.object({}),
  })
  noAnnotations(params: EmptyParams, _context: Context) {
    return this.echo('c8y-dummy-no-annotations', params);
  }

  @Tool({
    name: 'c8y-dummy-read-only-destructive-contradiction',
    description:
      'Dummy tool: readOnlyHint=true and destructiveHint=true, closed-world. readOnlyHint wins. Expect tag "Read-only"; runs without approval by default; override starts at Never.',
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
    name: 'c8y-dummy-custom-title',
    description:
      'Dummy tool: read-only, closed-world, with a `title` annotation distinct from its name (visible in the tools API only). Runs without approval by default; override starts at Never.',
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
