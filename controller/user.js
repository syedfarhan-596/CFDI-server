const { StatusCodes } = require("http-status-codes");
const { UserAuthentication } = require("../services/user-auth");
const { UserOperations } = require("../services/user-oprations");
const { UserOtp } = require("../services/user-auth");

const SendOtpToEmail = async (req, res) => {
  const { success, message } = await UserOtp.createOtp(req.body);
  res.status(StatusCodes.OK).json({ success, message });
};

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
  },
  region: bucketRegion,
});

const CreateUserController = async (req, res) => {
  await UserOtp.verifyOtp(req.body);
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = req.file.originalname.split(".").pop();
  const fileName = `${req.file.fieldname}-${uniqueSuffix}.${fileExtension}`;

  const params = {
    Bucket: bucketName,
    Key: `uploads/resumes/${fileName}`,
    Body: req.file.buffer,
    ContentType: req.file.minetype,
  };
  const command = new PutObjectCommand(params);

  await s3.send(command);
  const { token, name } = await UserAuthentication.createUser(
    req.body,
    req.file,
    fileName
  );
  res.status(StatusCodes.CREATED).json({ token, name });
};

const LoginUserController = async (req, res) => {
  const { token, name } = await UserAuthentication.loginUser(req.body);
  res.status(StatusCodes.OK).json({ token, name });
};

const GetUserController = async (req, res) => {
  const { user } = await UserOperations.getUser(req.user);
  if (user.status.offerLetter) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: `uploads/offerletter/${user.status.offerLetter}`,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    user.status.offerLetter = url;
  }
  if (user.status.completionCertificate) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: `uploads/certificate/${user.status.completionCertificate}`,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    user.status.completionCertificate = url;
  }

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
