const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const {
  CreateAdminController,
  LoginAdminController,
  GetUsersForAdminController,
  GetAdmin,
  GetUsersCount,
  GetAllAdmins,
  DeleteAdmin,
  GetUsersStatistics,
  GetSingleUser,
  UpdateUser,
  DeleteUserStatus,
  DeleteUser,
} = require("../controller/admin");
const AdminAuthenticationMiddleware = require("../middleware/admin-authorization");

router.route("/register").post(CreateAdminController);
router.route("/login").post(LoginAdminController);
router.route("/admin").get(AdminAuthenticationMiddleware, GetAdmin);
router
  .route("/delete/:userId/:status")
  .delete(AdminAuthenticationMiddleware, DeleteUserStatus);
router.route("/count").get(AdminAuthenticationMiddleware, GetUsersCount);
router.route("/admins").get(AdminAuthenticationMiddleware, GetAllAdmins);
router
  .route("/delete/:userId")
  .delete(AdminAuthenticationMiddleware, DeleteUser);
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
