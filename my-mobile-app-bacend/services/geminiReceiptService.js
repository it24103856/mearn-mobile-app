import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the model that is available in your API key – we found "gemini-2.5-flash" works.
const MODEL_NAME = "gemini-2.5-flash";
const GEMINI_API_KEY="AIzaSyA5lBnGckfEIvvv_P_75dcr3g-Q5Wmbip8"

const normalizeMimeType = (contentType = "") => {
    const safeType = contentType.split(";")[0].trim().toLowerCase();
    if (safeType) return safeType;
    return "image/jpeg";
};

const parseJsonFromResponse = (text = "") => {
    const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
    return JSON.parse(cleaned);
};

export const analyzeReceiptWithGemini = async ({ receiptUrl, expectedAmount, expectedCurrency,expectedRemark }) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Add it to your environment variables.");
    }

    // Step 1: Download the image from the public URL
    console.log("Downloading receipt image from:", receiptUrl);
    const imageResponse = await axios.get(receiptUrl, { responseType: "arraybuffer" });
    const mimeType = normalizeMimeType(imageResponse.headers["content-type"]);
    const base64Image = Buffer.from(imageResponse.data).toString("base64");
    console.log("Image downloaded, size:", imageResponse.data.length, "bytes");

    // Step 2: Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Step 3: Build the prompt
    const prompt = `You are verifying a travel booking payment receipt.
Return ONLY valid JSON (no markdown block) using this exact schema:
{
  "isReceipt": boolean,
  "paymentConfirmed": boolean,
  "extractedAmount": number | null,
  "extractedCurrency": string | null,
  "extractedRemark": string | null,
  "transactionId": string | null,
  "paymentDate": string | null,
  "confidence": number,
  "reason": string
}

Rules:
- expectedAmount: ${expectedAmount}
- expectedCurrency: ${expectedCurrency || "LKR"}
- expectedRemark: ${expectedRemark} (Verify if this or something very similar is written on the receipt).
- paymentConfirmed should be true only when a payment receipt is visible and the amount matches the expected amount.
- confidence should be a number between 0 and 1.
- If a field is missing in the image, return null for that field.`;

    // Step 4: Send to Gemini
    console.log("Sending request to Gemini API...");
    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType,
                data: base64Image,
            },
        },
    ]);

    const text = result?.response?.text?.() || "";
    console.log("Raw Gemini response text:", text);
    const parsed = parseJsonFromResponse(text);
    console.log("Parsed JSON:", parsed);

    // Step 5: Validate remark if expected remark is provided
    let paymentConfirmed = Boolean(parsed.paymentConfirmed);
    let validationReason = parsed.reason || "No reason provided by model";

    if (expectedRemark && parsed.extractedRemark) {
        const remarkMatch = parsed.extractedRemark.toLowerCase().trim() === expectedRemark.toLowerCase().trim();
        if (!remarkMatch) {
            paymentConfirmed = false;
            validationReason = `Remark mismatch: Expected '${expectedRemark}' but found '${parsed.extractedRemark}'. Amount matched but remark validation failed.`;
            console.log("❌ Remark mismatch - paymentConfirmed set to false:", validationReason);
        } else {
            console.log("✅ Remark matched!");
        }
    }

    // Step 6: Return structured result
    return {
        isReceipt: Boolean(parsed.isReceipt),
        paymentConfirmed: paymentConfirmed,
        extractedAmount: typeof parsed.extractedAmount === "number" ? parsed.extractedAmount : null,
        extractedCurrency: parsed.extractedCurrency || null,
        extractedRemark: parsed.extractedRemark || null,
        transactionId: parsed.transactionId || null,
        paymentDate: parsed.paymentDate || null,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
        reason: validationReason,
    };
};