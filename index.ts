import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import Express, { Application, Request, Response } from "express";
import connectToDB from "./configs/db/dbConnection";


const app:Application = Express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    Express.json({
      limit: "10mb",
    })
  );
app.use(cors());


// Sample route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ success: "true", message: "Welcome to the API " });
});

const StartServer = async () => {
    app.listen(PORT,async () => {
        try{
            await connectToDB();
            console.log(`Server is running on port ${PORT}`);    
        }catch(error:any){
            console.error("Error connecting to database: ", error.message);
        }
    });
}

StartServer();