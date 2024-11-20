import mongoose from "mongoose";

const invoiceDataSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
    },
    invoiceDate: {
        type: Date,
        required: true,
    },
    invoiceAmount: {
        type: Number,
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    customerEmail: {
        type: String,
        required: true,
    },
    customerPhone: {
        type: String,
        required: true,
    },
    customerAddress: {
        type: String,
        required: true,
    },
    
},
{
    timestamps: true,
});