import { z } from "zod";
import { insertReportSchema, reports } from "./schema";

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
      method: "GET" as const,
      path: "/api/reports",
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/reports/:id",
      responses: {
        200: z.custom<typeof reports.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/reports",
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
      method: "POST" as const,
      path: "/api/reports/generate",
      input: z.object({
        description: z.string(),
      }),
      responses: {
        200: z.object({
          incidentType: z.string(),
          structuredReport: z
            .object({
              incidentType: z.string(),
              description: z.string(),
              executiveSummary: z
                .object({
                  incidentType: z.string().optional(),
                  attackVector: z.string().optional(),
                  severityLevel: z.string().optional(),
                  dateAndTime: z.string().optional(),
                  victim: z.string().optional(),
                  organization: z.string().optional(),
                  overallImpact: z.string().optional(),
                })
                .passthrough()
                .optional(),
              classification: z
                .object({
                  primaryAttack: z.string().optional(),
                  attackTypes: z.array(z.string()).optional(),
                  initialAttackVector: z.string().optional(),
                  severity: z.string().optional(),
                })
                .passthrough()
                .optional(),
              entities: z.record(z.any()).optional(),
              incidentTimeline: z
                .array(
                  z
                    .object({
                      time: z.string().optional(),
                      event: z.string().optional(),
                    })
                    .passthrough(),
                )
                .optional(),
              technicalAnalysis: z.record(z.any()).optional(),
              iocs: z.record(z.any()).optional(),
              assetsAffected: z.array(z.string()).optional(),
              impactAssessment: z.record(z.any()).optional(),
              evidenceSummary: z.array(z.string()).optional(),
              immediateActionsTaken: z.array(z.string()).optional(),
              recommendedNextSteps: z.array(z.string()).optional(),
              firDraft: z.string().optional(),
              annexure: z.array(z.string()).optional(),
              aiConfidenceScore: z.number().min(0).max(100).optional(),
              modeOfAttack: z.string().optional(),
              impact: z.string().optional(),
              suggestedCategory: z.string().optional(),
              nextSteps: z.array(z.string()).optional(),
              generatedReportText: z.string().optional(),
              extractedDetails: z.record(z.any()).optional(),
              guidance: z
                .object({
                  immediate: z.array(z.string()),
                  security: z.array(z.string()),
                  evidence: z.array(z.string()),
                  nextSteps: z.array(z.string()),
                })
                .optional(),
            })
            .passthrough(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
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
