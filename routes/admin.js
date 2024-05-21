const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       // determine destination dynamically based on file fieldname
//       if (file.fieldname === "offerletter") {
//         cb(null, path.join(__dirname, "../uploads/user/offerletter"));
//       } else if (file.fieldname === "certificate") {
//         cb(null, path.join(__dirname, "../uploads/user/certificate"));
//       } else {
//         // Handle invalid fieldname
//         cb(new Error("Invalid field name"));
//       }
//     },
//     filename: function (req, file, cb) {
//       const fileExtension = path.extname(file.originalname);
//       const uniqueSuffix =
//         Date.now() + "-" + Math.round(Math.random() * 1e9) + fileExtension;
//       cb(null, file.fieldname + "-" + uniqueSuffix);
//     },
//   }),
// });

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const {
  CreateAdminController,
  LoginAdminController,
  GetUsersForAdminController,
  SendOTPAdmin,
  GetAdmin,
  GetUsersCount,
  GetAllAdmins,
  DeleteAdmin,
  GetUsersStatistics,
  GetSingleUser,
  UpdateUser,
} = require("../controller/admin");
const AdminAuthenticationMiddleware = require("../middleware/admin-authorization");

router.route("/sendotp").post(SendOTPAdmin);
router.route("/register").post(CreateAdminController);
router.route("/login").post(LoginAdminController);
router.route("/admin").get(AdminAuthenticationMiddleware, GetAdmin);
router.route("/count").get(AdminAuthenticationMiddleware, GetUsersCount);
router.route("/admins").get(AdminAuthenticationMiddleware, GetAllAdmins);
router
  .route("/user/:userId")
  .get(AdminAuthenticationMiddleware, GetSingleUser)
  .put(
    AdminAuthenticationMiddleware,
    upload.fields([
      { name: "offerletter", maxCount: 1 },
      { name: "certificate", maxCount: 1 },
    ]),
    UpdateUser
  );
router
  .route("/users/stats")
  .get(AdminAuthenticationMiddleware, GetUsersStatistics);

router
  .route("/delete/admin/:id/:secret")
  .delete(AdminAuthenticationMiddleware, DeleteAdmin);
router
  .route("/users")
  .get(AdminAuthenticationMiddleware, GetUsersForAdminController);

module.exports = router;
