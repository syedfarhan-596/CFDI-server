// packages import
const express = require("express");
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");

//modules import
const connectDB = require("./db/connect-DB");
const PageNotFound = require("./errors/not-found");
const ErrorhandlerMiddleWare = require("./middleware/error-handler");

// router
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

const app = express();

//built-in middlewares
app.use(cors());
app.use(express.json());

app.use("/resume", express.static("./uploads/user/resume"));
app.use("/offerletter", express.static("./uploads/user/offerletter"));
app.use("/certificate", express.static("./uploads/user/certificate"));

//main routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

//middleware
app.use(PageNotFound);
app.use(ErrorhandlerMiddleWare);

const port = 4000;
const start = () => {
  connectDB(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`Server is active on port ${port}`);
  });
};

start();
