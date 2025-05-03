import express from "express";
import cors from "cors";
import cokieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORE_ORIGIN,
    credentials: true,
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cokieParser());

// import Rotes
import userRoutes from "./routes/user.routes.js";

// routes declartions
app.use("/api/v1/users", userRoutes);

// http://localhost:8000/api/v1/users/register

export { app }