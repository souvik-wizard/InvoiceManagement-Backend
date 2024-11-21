import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import fileRoutes from './routes/file';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Routes
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ success: "Your server is running!" });
  });
app.use('/files', fileRoutes); 

const StartServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

StartServer();
