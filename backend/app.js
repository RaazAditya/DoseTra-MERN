import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/authRoutes.js"
import medicineRoutes from "./routes/medicineRoutes.js"

const app = express();

// default middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

// apis
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/medicine", medicineRoutes)

export {app}