const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const {
  CreateUserController,
  CreateTempUserController,
  LoginUserController,
  GetUserController,
  UpdateUserController,
  ForgotPassword,
  SendOtpToEmail,
} = require("../controller/user");

const UserAuthorizationMiddleware = require("../middleware/user-authorization");

router.route("/sendotp").post(SendOtpToEmail);
router
  .route("/temp/register")
  .post(upload.single("resumeFile"), CreateTempUserController);

router.route("/register").post(CreateUserController);
router.route("/login").post(LoginUserController);

router.route("/user").get(UserAuthorizationMiddleware, GetUserController);
router.route("/update").put(UserAuthorizationMiddleware, UpdateUserController);
router.route("/reset/password").post(ForgotPassword);

module.exports = router;
