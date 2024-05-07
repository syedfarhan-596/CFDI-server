const { StatusCodes } = require("http-status-codes");
const { UserAuthentication } = require("../services/user-auth");
const { UserOperations } = require("../services/user-oprations");
const { UserOtp } = require("../services/user-auth");

const SendOtpToEmail = async (req, res) => {
  const { success, message } = await UserOtp.createOtp(req.body);
  res.status(StatusCodes.OK).json({ success, message });
};

const CreateUserController = async (req, res) => {
  await UserOtp.verifyOtp(req.body);
  const { token, name } = await UserAuthentication.createUser(
    req.body,
    req.file
  );
  res.status(StatusCodes.CREATED).json({ token, name });
};

const LoginUserController = async (req, res) => {
  const { token, name } = await UserAuthentication.loginUser(req.body);
  res.status(StatusCodes.OK).json({ token, name });
};

const GetUserController = async (req, res) => {
  const { user } = await UserOperations.getUser(req.user);
  res.status(StatusCodes.OK).json({ user, exp: req.user.exp });
};

const UpdateUserController = async (req, res) => {
  const { user } = await UserOperations.updateUser(req.user, req.body);
  res.status(StatusCodes.OK).json({ user, exp: req.user.exp });
};

const ForgotPassword = async (req, res) => {
  await UserOtp.verifyOtp(req.body);
  const { message } = await UserAuthentication.resetPassword(req.body);
  res.status(StatusCodes.OK).json({ message });
};

module.exports = {
  CreateUserController,
  LoginUserController,
  GetUserController,
  UpdateUserController,
  SendOtpToEmail,
  ForgotPassword,
};
