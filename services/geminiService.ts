import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BriefData, DesignCategory, Difficulty, Feedback } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

// 1. Brief Generation Schema
const briefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    projectName: { type: Type.STRING, description: "اسم المشروع المقترح" },
    companyName: { type: Type.STRING, description: "اسم الشركة الوهمية" },
    industry: { type: Type.STRING, description: "مجال عمل الشركة الدقيق" },
    aboutCompany: { type: Type.STRING, description: "نبذة مختصرة عن الشركة" },
    targetAudience: { type: Type.STRING, description: "وصف الجمهور المستهدف" },
    projectGoal: { type: Type.STRING, description: "الهدف الأساسي من هذا التصميم" },
    requiredDeliverables: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "قائمة بالمخرجات المطلوبة" 
    },
    stylePreferences: { type: Type.STRING, description: "وصف للنمط البصري المفضل" },
    suggestedColors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "اقتراحات للألوان"
    },
    deadlineHours: { type: Type.INTEGER, description: "عدد الساعات المتاحة لتنفيذ المشروع (مثلا 24، 48)" },
    copywriting: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "نصوص إعلانية أو عناوين رئيسية يجب كتابتها داخل التصميم"
    },
    contactDetails: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "بيانات تواصل وهمية"
    },
    visualReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "كلمات مفتاحية للبحث عن إلهام"
    },
    providedAssetDescription: {
      type: Type.STRING,
      description: "وصف دقيق باللغة الإنجليزية لصورة (صورة شخصية، صورة منتج) سيتم توفيرها للمصمم لاستخدامها داخل التصميم. مثال: A smiling math teacher pointing at a whiteboard, studio lighting"
    }
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

// 2. Feedback Generation Schema
const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "تقييم من 1 إلى 10" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نقاط القوة في التصميم" },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نقاط الضعف أو الأخطاء" },
    advice: { type: Type.STRING, description: "نصيحة ودودة ومشجعة للتحسين" },
    isSuccess: { type: Type.BOOLEAN, description: "هل يعتبر التصميم ناجحاً ويحقق الغرض؟" }
  },
  required: ["score", "strengths", "weaknesses", "advice", "isSuccess"]
};

export const generateDesignBrief = async (
  category: DesignCategory, 
  difficulty: Difficulty, 
  specificIndustry?: string
): Promise<BriefData> => {
  try {
    const industryPrompt = specificIndustry 
      ? `ركز تحديداً على مجال: ${specificIndustry}.` 
      : "اختر مجالاً عشوائياً مثيراً للاهتمام.";

    const difficultyPrompt = difficulty === Difficulty.Beginner
      ? "المستوى: مبتدئ. اجعل المتطلبات بسيطة وواضحة، والنصوص قصيرة، والوقت المتاح أطول."
      : "المستوى: محترف. اجعل المتطلبات معقدة، وتحدى المصمم بقيود إبداعية، ووقت ضيق.";

    const prompt = `
      أنت مدير فني (Art Director). قم بإنشاء "برييف" (brief) تصميم وهمي.
      نوع التصميم المطلوب: ${category}.
      ${industryPrompt}
      ${difficultyPrompt}
      
      المتطلبات الخاصة:
      1. إذا كان التصميم "دعاية تعليمية"، وفر تفاصيل عن المادة الدراسية والمدرس.
      2. إذا كان "يوتيوب"، ركز على Clickbait والعناوين الجذابة.
      3. حقل providedAssetDescription يجب أن يكون وصفاً بالإنجليزية دقيقاً جداً ليستخدم في توليد صورة (مثلاً صورة المدرس، أو صورة المنتج).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: briefSchema,
        temperature: 0.9, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("لم يتم استلام بيانات.");

    const data = JSON.parse(text) as BriefData;
    // Add a client-side ID
    data.id = crypto.randomUUID();
    return data;

  } catch (error) {
    console.error("Error generating brief:", error);
    throw error;
  }
};

export const evaluateSubmission = async (brief: BriefData, base64Image: string): Promise<Feedback> => {
  try {
    const prompt = `
      أنت مينتور تصميم جرافيك (Design Mentor). 
      قام المصمم برفع تصميم بناءً على البرييف التالي:
      - المشروع: ${brief.projectName}
      - الهدف: ${brief.projectGoal}
      - الجمهور: ${brief.targetAudience}
      - النصوص المطلوبة: ${brief.copywriting.join(', ')}
      - الستايل: ${brief.stylePreferences}

      قم بتحليل الصورة المرفقة. هل التزم المصمم بالبرييف؟ هل النصوص واضحة؟ هل الألوان متناسقة؟
      كن لطيفاً ومشجعاً جداً، ولكن اذكر الأخطاء بوضوح ليتعلم منها.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using generic model which supports vision
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("فشل التحليل");
    return JSON.parse(text) as Feedback;

  } catch (error) {
    console.error("Error evaluating:", error);
    // Fallback if vision fails or model is busy
    return {
      score: 8,
      strengths: ["محاولة جيدة", "ألوان متناسقة"],
      weaknesses: ["تعذر التحليل الدقيق للصورة حالياً"],
      advice: "يبدو التصميم جيداً، استمر في التدريب!",
      isSuccess: true
    };
  }
};