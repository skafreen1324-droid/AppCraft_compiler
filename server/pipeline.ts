import { GoogleGenAI, Type } from "@google/genai";
import { Intent, Design, AppConfig, CompilationResult, IntentSchema, DesignSchema, AppConfigSchema } from "../src/compiler/types.ts";
import { v4 as uuidv4 } from "uuid";

export class CompilerPipeline {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async compile(prompt: string): Promise<CompilationResult> {
    const result: CompilationResult = {
      id: uuidv4(),
      stages: {},
      metrics: {
        startTime: Date.now(),
        repairCount: 0,
      },
      errors: [],
    };

    try {
      // 1. Intent Extraction
      result.stages.intent = await this.stageIntent(prompt);
      
      // 2. System Design
      result.stages.design = await this.stageDesign(result.stages.intent);

      // 3. Schema Generation
      result.stages.schema = await this.stageSchema(result.stages.design);

      // 4. Refinement & Repair
      result.stages.refinement = await this.stageRefine(result.stages.schema, result.stages.design);

      result.metrics.endTime = Date.now();
      return result;
    } catch (error: any) {
      result.errors.push(error.message);
      return result;
    }
  }

  private async stageIntent(prompt: string): Promise<Intent> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the core intent from this user prompt into a structured JSON for software construction.
      Prompt: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            description: { type: Type.STRING },
            coreGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
            userPersonas: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
            monetization: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["none", "subscription", "one-time", "ads"] },
                details: { type: Type.STRING },
              },
              required: ["type"],
            },
          },
          required: ["productName", "description", "coreGoals", "userPersonas", "keyEntities", "monetization"],
        },
      },
    });

    return IntentSchema.parse(JSON.parse(response.text));
  }

  private async stageDesign(intent: Intent): Promise<Design> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a system design based on this intent: ${JSON.stringify(intent)}. 
      Define the architecture, entities, roles, and page flows.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            architecture: { type: Type.STRING },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        description: { type: Type.STRING },
                        isPrivate: { type: Type.BOOLEAN },
                      },
                      required: ["name", "type", "description"],
                    },
                  },
                  relations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        target: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["one-to-one", "one-to-many", "many-to-many"] },
                      },
                    },
                  },
                },
                required: ["name", "fields", "relations"],
              },
            },
            userRoles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  permissions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            pageFlows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  page: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  access: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    return DesignSchema.parse(JSON.parse(response.text));
  }

  private async stageSchema(design: Design): Promise<AppConfig> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Use Pro for complex schema generation
      contents: `Generate a complete executable AppConfig based on this System Design: ${JSON.stringify(design)}.
      Ensure all DB tables match API endpoints and UI pages.`,
      config: {
        responseMimeType: "application/json",
        // Here we use a simpler schema for the response to avoid hitting limits, 
        // but we will validate it against AppConfigSchema manually.
      },
    });

    // Mandatory Validation + Repair Engine
    return await this.validateAndRepair(response.text, design);
  }

  private async validateAndRepair(jsonStr: string, design: Design): Promise<AppConfig> {
    let currentJson;
    try {
      currentJson = JSON.parse(jsonStr);
    } catch (e) {
      // Automatic Repair: Attempt to fix broken JSON if model failed
      const fixResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Fix this broken JSON: ${jsonStr}. Return only the valid JSON.`,
      });
      currentJson = JSON.parse(fixResponse.text);
    }

    const validation = AppConfigSchema.safeParse(currentJson);
    if (validation.success) return validation.data;

    // Recursive Repair Logic
    console.warn("Schema validation failed, attempting repair...");
    const repairResponse = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `The following generated schema is invalid: ${JSON.stringify(currentJson)}.
      Errors: ${JSON.stringify(validation.error.errors)}.
      Please fix the schema to match this requirement: ${JSON.stringify(design)}.
      Return the full corrected JSON.`,
      config: { responseMimeType: "application/json" }
    });

    return AppConfigSchema.parse(JSON.parse(repairResponse.text));
  }

  private async stageRefine(schema: AppConfig, design: Design): Promise<AppConfig> {
    // Final Polish: Ensure consistency and add missing details
    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Final Refinement: Review the schema and design for inconsistencies.
      Schema: ${JSON.stringify(schema)}
      Design: ${JSON.stringify(design)}
      Ensure DB triggers, auth guards, and UI transitions are perfectly aligned.`,
      config: { responseMimeType: "application/json" }
    });
    return AppConfigSchema.parse(JSON.parse(response.text));
  }

  async runEvaluation() {
    const prompts = [
      "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.",
      "A simplified task management tool like Trello with drag and drop, workspace invites, and kanban view.",
      "An e-commerce store for digital art with payment gateway integration, artist profiles, and secure downloads.",
      // Adding more would be good, but starting with these.
    ];

    const results = [];
    for (const prompt of prompts) {
      const start = Date.now();
      const compilation = await this.compile(prompt);
      results.push({
        prompt,
        success: compilation.errors.length === 0,
        latency: Date.now() - start,
        stages: Object.keys(compilation.stages),
        errors: compilation.errors,
      });
    }
    return results;
  }
}
