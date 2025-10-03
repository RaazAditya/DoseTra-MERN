import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/authRoutes.js"
import medicineRoutes from "./routes/medicineRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import doseRoutes from "./routes/doseRoutes.js"
import notificationRoutes from "./routes/notificationsRoutes.js"

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
app.use("/api/schedules", scheduleRoutes);
app.use("/api/doses", doseRoutes);
app.use("/api/notifications", notificationRoutes);

export {app}