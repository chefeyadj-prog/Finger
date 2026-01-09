import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord } from "./types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey });

export const generateAttendanceReport = async (records: AttendanceRecord[]) => {
  const prompt = `حلل بيانات الحضور التالية وقدم تقريراً احترافياً باللغة العربية يشمل:
  1. ملخص عام للحضور.
  2. تحديد الموظفين الأكثر انضباطاً.
  3. تحديد الموظفين الذين يعانون من تأخير متكرر.
  4. توصيات لتحسين الإنتاجية بناءً على ساعات العمل.
  
  البيانات: ${JSON.stringify(records)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "عذراً، حدث خطأ أثناء إنشاء التقرير الذكي.";
  }
};
