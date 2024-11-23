import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import ExcelJS from "exceljs";
import { FileData } from "../types/type";
// Check if API Key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

// Initialize Gemini API Client
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Function to read and parse Excel file using exceljs
async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0]; 
  const rows = sheet.getRows(1, sheet.rowCount);
  const data = rows?.map(row => row.values); 
  return data;
}

// Function to upload and generate content for PDFs, images, and Excel files
async function uploadAndGenerateContent({ filePath, displayName, mimeType, prompt }: FileData) {
  try {
    // Upload the file (works for image, PDF, and Excel)
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName,
    });

    console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);

    // Generate content based on file type
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
    });

    let result;
    if (mimeType.startsWith("image/")) {
      // If the file is an image, use the image-specific logic
      result = await model.generateContent([
        prompt, 
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
      ]);
    } else if (mimeType === "application/pdf") {
      // If the file is a PDF, use the PDF-specific logic
      result = await model.generateContent([
        prompt, 
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
      ]);
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      // If the file is an Excel file, process it with exceljs
      const excelData = await parseExcel(filePath);
      console.log("Excel Data:", excelData);
      const excelDataPrompt = `Process this Excel data: ${JSON.stringify(excelData)}`;

      result = await model.generateContent([
        prompt, 
        excelDataPrompt, 
      ]);
      console.log("Excel Data Prompt:", result);
    } else {
      throw new Error("Unsupported file type");
    }

    console.log("Generated Content:", result.response.text());
    return result.response.text();
  } catch (error) {
    console.error("Error during file upload or content generation:", error);
    throw error;
  }
}

export { uploadAndGenerateContent };

