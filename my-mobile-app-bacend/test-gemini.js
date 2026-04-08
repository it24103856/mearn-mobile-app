import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyA5lBnGckfEIvvv_P_75dcr3g-Q5Wmbip8";
const MODEL_NAME = "gemini-2.5-flash";   // හෝ "gemini-2.5-pro"

const testGemini = async () => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  try {
    const prompt = "Say 'Hello, Gemini API is working!' in one sentence.";
    const result = await model.generateContent(prompt);
    console.log("✅ Gemini API responded:", result.response.text());
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) console.error(error.response.data);
  }
};

testGemini();