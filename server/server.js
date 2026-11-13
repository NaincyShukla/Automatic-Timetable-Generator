const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const teacherRoutes = require("./routes/teacherRoutes");
const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const locationRoutes = require("./routes/locationRoutes");
const divisionRoutes = require("./routes/divisionRoutes");
const settingRoutes = require("./routes/settingRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const connectDB = require("./config/db");

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));

app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("EduScheduler Backend Running 🚀");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/divisions", divisionRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/timetable", timetableRoutes);
// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});