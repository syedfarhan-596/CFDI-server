const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads/user/resume"),
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + fileExtension;
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

const {
  CreateUserController,
  LoginUserController,
  GetUserController,
  UpdateUserController,
  ForgotPassword,
  SendOtpToEmail,
} = require("../controller/user");

const UserAuthorizationMiddleware = require("../middleware/user-authorization");

router.route("/sendotp").post(SendOtpToEmail);
router
  .route("/register")
  .post(upload.single("resumeFile"), CreateUserController);
router.route("/login").post(LoginUserController);

router.route("/user").get(UserAuthorizationMiddleware, GetUserController);
router.route("/update").put(UserAuthorizationMiddleware, UpdateUserController);
router.route("/reset/password").post(ForgotPassword);

module.exports = router;
