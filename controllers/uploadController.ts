import { Request, Response } from 'express';
import multer from 'multer';
import { uploadAndGenerateContent } from '../utils/extraction'; 
import fs from 'fs';  

// Multer setup to store uploaded files temporarily
const upload = multer({ dest: 'uploads/' });

 // Handle a single file upload
export const uploadFile = upload.single('file'); 

export const handleFileUpload = async (req: Request, res: Response) => {
  let filePath: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // File path from the upload directory
    filePath = req.file.path;
    console.log("File path:", filePath);
    const mimeType = req.file.mimetype;  // Get MIME type
    console.log("MIME type:", mimeType);
    const displayName = req.file.originalname;  // Get the original file name
    console.log("File name:", displayName);

    const prompt = `
    I am building a React application to display invoice data in different tables. The data will be sent from the backend to the frontend. Please structure the data in JSON format.This should include the following fields, and the keys should be always in PascalCase.If any of the fields in the dataset are unavailable or missing, please provide "N/A" as the value for those fields.Also take care of all edge cases and ensure that the JSON is valid. If there is unit price and tax is given, then calculate the price with out tax / price with tax depends upon different scenario. NEVER INCLUDE ANY NOTES OR ANY OTHER INFORMATION WITH THE JSON DATA.ONLY PROVIDE THE JSON DATA AND MAKE SURE THE DATA IS NOT INCOMPLETE.
    
       - Serial Number
       - Customer Name
       - Product Name
       - Quantity
       - Tax
       - Total Amount
       - Date
       - Unit Price 
       - Price with Tax
       - Phone Number
       - Total Purchase Amount 
      
    `;
    
    const generatedContent = await uploadAndGenerateContent({ filePath, displayName, mimeType, prompt });
    console.log("Generated content:", generatedContent);
    const jsonContent = generatedContent.replace(/```json/g, '').replace(/```/g, '').trim();
    // console.log("Generated JSON content:", jsonContent);

    res.status(200).json({
        success: true,
        message: 'File uploaded and processed successfully.',
        data: jsonContent,
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ success: false, message: 'Error uploading file.' });
  } 
  finally{
    fs.unlink(filePath, (err) => {
        console.log("File path for deletion:", filePath);
    if (err) {
        console.error("Error deleting file:", err);
    } else {
        console.log(`File ${filePath} deleted successfully.`);
    }
    });
  }
};
