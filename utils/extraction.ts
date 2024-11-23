import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import ExcelJS from "exceljs";
import { FileData } from "../types/type";

const BATCH_SIZE = 40;
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

function chunkArray<T>(array: T[], size: number): T[][] {
  return array.reduce((chunks: T[][], item: T, index: number) => {
    const chunkIndex = Math.floor(index / size);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(item);
    return chunks;
  }, []);
}

async function parseExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const rows = sheet.getRows(1, sheet.rowCount);
  return rows?.map(row => row.values);
}

function cleanAndParseResponse(responseText: string): any[] {
  try {
    // Remove code blocks and trim whitespace
    const cleanJson = responseText.replace(/```json\n?|```\n?/g, '').trim();
    
    // Parse the cleaned JSON
    const parsedData = JSON.parse(cleanJson);
    
    // Ensure the response is always an array
    return Array.isArray(parsedData) ? parsedData : [parsedData];
  } catch (error) {
    console.error("Error parsing response:", error);
    // Return empty array if parsing fails
    return [];
  }
}

async function processImage(
  model: any,
  fileData: { mimeType: string; fileUri: string },
  prompt: string
): Promise<any[]> {
  try {
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          mimeType: fileData.mimeType,
          fileUri: fileData.fileUri,
        },
      },
    ]);
    
    return cleanAndParseResponse(result.response.text());
  } catch (error) {
    console.error("Error processing image:", error);
    return [];
  }
}

async function processPDF(
  model: any,
  fileData: { mimeType: string; fileUri: string },
  prompt: string
): Promise<any[]> {
  try {
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          mimeType: fileData.mimeType,
          fileUri: fileData.fileUri,
        },
      },
    ]);
    
    return cleanAndParseResponse(result.response.text());
  } catch (error) {
    console.error("Error processing PDF:", error);
    return [];
  }
}

async function processBatch(
  model: any,
  batch: any[],
  prompt: string,
  batchIndex: number
): Promise<any[]> {
  try {
    const batchPrompt = `${prompt}\nProcess batch ${batchIndex + 1} of the data: ${JSON.stringify(batch)}`;
    const result = await model.generateContent([batchPrompt]);
    return cleanAndParseResponse(result.response.text());
  } catch (error) {
    console.error(`Error processing batch ${batchIndex + 1}:`, error);
    return [];
  }
}

async function uploadAndGenerateContent({ filePath, displayName, mimeType, prompt }: FileData) {
  try {
    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName,
    });

    console.log(`Uploaded file ${uploadResponse.file.displayName}`);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    let processedData: any[] = [];

    // Handle different file types of uploads
    if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      const excelData = await parseExcel(filePath);
      if (!excelData) throw new Error("No data found in Excel file");

      if (excelData.length > BATCH_SIZE) {
        const batches = chunkArray(excelData, BATCH_SIZE);
        console.log(`Processing ${batches.length} batches...`);

        for (let i = 0; i < batches.length; i++) {
          console.log(`Processing batch ${i + 1}/${batches.length}`);
          const batchResult = await processBatch(model, batches[i], prompt, i);
          processedData = [...processedData, ...batchResult];
          
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        processedData = await processBatch(model, excelData, prompt, 0);
      }
    } else if (mimeType.startsWith("image/")) {
      processedData = await processImage(model, {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri,
      }, prompt);
    } else if (mimeType === "application/pdf") {
      processedData = await processPDF(model, {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri,
      }, prompt);
    } else {
      throw new Error("Unsupported file type");
    }

    // Return clean JSON string
    return JSON.stringify(processedData);
  } catch (error) {
    console.error("Error during file upload or content generation:", error);
    throw error;
  }
}

export { uploadAndGenerateContent };