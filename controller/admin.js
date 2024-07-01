const { StatusCodes } = require("http-status-codes");
const { AdminAuthentication, AdminOtp } = require("../services/admin-auth");
const { AdminOperations } = require("../services/admin-operations");

const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
  },
  region: bucketRegion,
});

const CreateAdminController = async (req, res) => {
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
  const getObjectParams = {
    Bucket: bucketName,
    Key: `uploads/resumes/${user.resume}`,
  };
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  user.resume = url;
  res.status(StatusCodes.OK).json({ user });
};

const UpdateUser = async (req, res) => {
  const { success, message, user } = await AdminOperations.updateUser(
    req.params.userId,
    req.body,
    req.files
  );

  res.status(StatusCodes.OK).json({ success, message, user });
};

const DeleteUserStatus = async (req, res) => {
  const { user } = await AdminOperations.deleteStatus(req.params);

  res.status(StatusCodes.OK).json({ user });
};

const DeleteUser = async (req, res) => {
  const { userId } = await AdminOperations.deleteUser(req.params.userId);
  res.status(StatusCodes.OK).json({ userId });
};

module.exports = {
  CreateAdminController,
  LoginAdminController,
  GetUsersForAdminController,
  GetAdmin,
  GetUsersCount,
  GetAllAdmins,
  DeleteAdmin,
  GetUsersStatistics,
  GetSingleUser,
  DeleteUserStatus,
  UpdateUser,
  DeleteUser,
};
