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

    const prompt = "I want to populate the invoice data in a table in the frontend of my application. Can you organize the data accordingly?";
    const generatedContent = await uploadAndGenerateContent({ filePath, displayName, mimeType, prompt });

    console.log("Generated content:", generatedContent);
    
    res.status(200).json({
        success: true,
        message: 'File uploaded and processed successfully.',
        data: generatedContent,
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
