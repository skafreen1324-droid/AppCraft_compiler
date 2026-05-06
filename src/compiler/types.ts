import { z } from "zod";

/**
 * 1. Intent Extraction Output
 */
export const IntentSchema = z.object({
  productName: z.string(),
  description: z.string(),
  coreGoals: z.array(z.string()),
  userPersonas: z.array(z.string()),
  keyEntities: z.array(z.string()),
  monetization: z.object({
    type: z.enum(["none", "subscription", "one-time", "ads"]),
    details: z.string().optional(),
  }),
});

export type Intent = z.infer<typeof IntentSchema>;

/**
 * 2. System Design Output
 */
export const DesignSchema = z.object({
  architecture: z.string(),
  entities: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      isPrivate: z.boolean().default(false),
    })),
    relations: z.array(z.object({
      target: z.string(),
      type: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
    })),
  })),
  userRoles: z.array(z.object({
    role: z.string(),
    permissions: z.array(z.string()),
  })),
  pageFlows: z.array(z.object({
    page: z.string(),
    purpose: z.string(),
    access: z.string(),
  })),
});

export type Design = z.infer<typeof DesignSchema>;

/**
 * 3. Final Code Schema
 */
export const AppConfigSchema = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.string(),
  }),
  database: z.object({
    tables: z.array(z.object({
      name: z.string(),
      columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        constraints: z.array(z.string()).optional(),
      })),
    })),
  }),
  api: z.array(z.object({
    path: z.string(),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    summary: z.string(),
    requestBody: z.any().optional(),
    response: z.any(),
    roles: z.array(z.string()),
  })),
  ui: z.object({
    theme: z.object({
      primaryColor: z.string(),
      fontFamily: z.string(),
    }),
    pages: z.array(z.object({
      route: z.string(),
      component: z.string(),
      props: z.record(z.any()),
      layout: z.string(),
    })),
  }),
  auth: z.object({
    strategies: z.array(z.string()),
    roleGates: z.record(z.array(z.string())),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export type CompilationResult = {
  id: string;
  stages: {
    intent?: Intent;
    design?: Design;
    schema?: AppConfig;
    refinement?: AppConfig;
  };
  metrics: {
    startTime: number;
    endTime?: number;
    tokens?: number;
    repairCount: number;
  };
  errors: string[];
};
