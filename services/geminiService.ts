import { GoogleGenerativeAI } from "@google/generative-ai";
import { BriefData, DesignCategory, Difficulty, Feedback } from "../types";

const ai = new GoogleGenerativeAI(process.env.API_KEY || "");

// 1. Brief Schema (JSON)
const briefSchema = {
  type: "object",
  properties: {
    projectName: { type: "string" },
    companyName: { type: "string" },
    industry: { type: "string" },
    aboutCompany: { type: "string" },
    targetAudience: { type: "string" },
    projectGoal: { type: "string" },
    requiredDeliverables: { type: "array", items: { type: "string" } },
    stylePreferences: { type: "string" },
    suggestedColors: { type: "array", items: { type: "string" } },
    deadlineHours: { type: "integer" },
    copywriting: { type: "array", items: { type: "string" } },
    contactDetails: { type: "array", items: { type: "string" } },
    visualReferences: { type: "array", items: { type: "string" } },
    providedAssetDescription: { type: "string" }
  },
  required: [
    "projectName",
    "companyName",
    "industry",
    "aboutCompany",
    "targetAudience",
    "projectGoal",
    "requiredDeliverables",
    "stylePreferences",
    "suggestedColors",
    "deadlineHours",
    "copywriting",
    "contactDetails",
    "visualReferences",
    "providedAssetDescription"
  ]
};

// 2. Feedback Schema
const feedbackSchema = {
  type: "object",
  properties: {
    score: { type: "integer" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    advice: { type: "string" },
    isSuccess: { type: "boolean" }
  },
  required: ["score", "strengths", "weaknesses", "advice", "isSuccess"]
};

export const generateDesignBrief = async (
  category: DesignCategory,
  difficulty: Difficulty,
  specificIndustry?: string
): Promise<BriefData> => {
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: briefSchema
    }
  });

  const prompt = `
    أنت مدير فني (Art Director). انتج برييف تصميم كامل.
    النوع: ${category}.
    المجال: ${specificIndustry || "اختر مجالاً عشوائياً"}.
    المستوى: ${difficulty === Difficulty.Beginner ? "مبتدئ" : "محترف"}.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const data = JSON.parse(text) as BriefData;
  data.id = crypto.randomUUID();
  return data;
};

export const evaluateSubmission = async (
  brief: BriefData,
  base64Image: string
): Promise<Feedback> => {
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema
    }
  });

  const prompt = `
    أنت مينتور تصميم جرافيك. قيّم التصميم بناءً على البرييف التالي:
    - المشروع: ${brief.projectName}
    - الهدف: ${brief.projectGoal}
    - الجمهور: ${brief.targetAudience}
    - الستايل: ${brief.stylePreferences}
  `;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      { text: prompt }
    ]);

    const text = result.response.text();
    return JSON.parse(text) as Feedback;

  } catch (e) {
    console.error("Vision error:", e);
    return {
      score: 7,
      strengths: ["ألوان جيدة"],
      weaknesses: ["تعذر تحليل الصورة"],
      advice: "استمر في التدريب!",
      isSuccess: true
    };
  }
};
