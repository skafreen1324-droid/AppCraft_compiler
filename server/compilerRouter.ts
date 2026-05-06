import { Router } from "express";
import { CompilerPipeline } from "./pipeline.ts";

export const compilerRouter = Router();
const pipeline = new CompilerPipeline();

compilerRouter.post("/compile", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const result = await pipeline.compile(prompt);
    res.json(result);
  } catch (error: any) {
    console.error("Compilation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

compilerRouter.get("/evaluation", async (req, res) => {
  const results = await pipeline.runEvaluation();
  res.json(results);
});
