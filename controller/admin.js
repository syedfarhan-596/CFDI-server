const { StatusCodes } = require("http-status-codes");
const { AdminAuthentication, AdminOtp } = require("../services/admin-auth");
const { AdminOperations } = require("../services/admin-operations");
const User = require("../models/user");

const SendOTPAdmin = async (req, res) => {
  const { message, success } = await AdminOtp.createOtp(req.body);
  res.status(StatusCodes.OK).json({ message, success });
};

const CreateAdminController = async (req, res) => {
  await AdminOtp.verifyOtp(req.body);
  const { token, name } = await AdminAuthentication.createAdmin(req.body);
  res.status(StatusCodes.CREATED).json({ token, name });
};

const LoginAdminController = async (req, res) => {
  const { token, name } = await AdminAuthentication.adminLogin(req.body);
  res.status(StatusCodes.OK).json({ token, name });
};

const GetAdmin = async (req, res) => {
  const { admin } = await AdminOperations.getAdmin(req);
  res.status(StatusCodes.OK).json({ admin });
};

const GetUsersForAdminController = async (req, res) => {
  const { users, count } = await AdminOperations.getUsers(req.query);
  res.status(StatusCodes.OK).json({ users, count });
};

const GetUsersCount = async (req, res) => {
  const { total, completed } = await AdminOperations.getCount();
  res.status(StatusCodes.OK).json({ total, completed });
};

const GetAllAdmins = async (req, res) => {
  const { admins } = await AdminOperations.getAllAdmin(req.query.page);
  res.status(StatusCodes.OK).json({ admins });
};

const DeleteAdmin = async (req, res) => {
  const { message } = await AdminOperations.deleteAdmin(
    req.params.id,
    req.params.secret
  );
  res.status(StatusCodes.OK).json({ message });
};

const GetUsersStatistics = async (req, res) => {
  const { data } = await AdminOperations.getStatistics();
  res.status(StatusCodes.OK).json({ data });
};

const GetSingleUser = async (req, res) => {
  const { user } = await AdminOperations.getUser(req.params.userId);
  res.status(StatusCodes.OK).json({ user });
};

const UpdateUser = async (req, res) => {
  const { success, message } = await AdminOperations.updateUser(
    req.params.userId,
    req.body,
    req.files
  );

  res.status(StatusCodes.OK).json({ success, message });
};

module.exports = {
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
};
