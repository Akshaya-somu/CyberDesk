
import { z } from 'zod';
import { insertReportSchema, reports } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reports/:id',
      responses: {
        200: z.custom<typeof reports.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: z.object({
        title: z.string(),
        rawDescription: z.string(),
      }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/reports/generate',
      input: z.object({
        description: z.string(),
      }),
      responses: {
        200: z.object({
          incidentType: z.string(),
          structuredReport: z.object({
            incidentType: z.string(),
            description: z.string(),
            modeOfAttack: z.string(),
            impact: z.string(),
            suggestedCategory: z.string(),
            nextSteps: z.array(z.string()),
          }),
        }),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
