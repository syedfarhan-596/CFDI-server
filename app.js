// packages import
const express = require("express");
require("dotenv").config();
require("express-async-errors");
const cors = require("cors");
const SendMail = require("./nodemailer");

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

//main routes

app.use("/").post((req, res) => {
  SendMail(
    "info@codefordigitalindia.com",
    `Message from ${req.body.name} ,Sender Email:- ${req.body.email}`,
    req.body.message
  );
});
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

//middleware
app.use(PageNotFound);
app.use(ErrorhandlerMiddleWare);

const port = process.env.PORT;
const start = () => {
  connectDB(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`Server is active on port ${port}`);
  });
};

start();
