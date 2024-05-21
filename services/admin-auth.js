const { BadRequestError, UnauthorizedError } = require("../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");

class AdminAuthentication {
  static async createAdmin(reqBody) {
    const { password } = reqBody;

    const salt = await bcrypt.genSalt(10);
    reqBody.password = await bcrypt.hash(password, salt);
    const admin = await Admin.create(reqBody);

    const token = jwt.sign(
      { adminId: admin._id, name: admin.name },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.KEY_LIFE }
    );

    return { token, name: admin.name };
  }
  static async adminLogin(reqBody) {
    const { email, password } = reqBody;
    if ((!email, !password)) {
      throw new BadRequestError("Please provide both email and password");
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new BadRequestError(`No admin with this ${email} email`);
    }
    const validatePassword = await bcrypt.compare(password, admin.password);
    if (!validatePassword) {
      throw new UnauthorizedError("Invalid Email or Password try again");
    }
    const token = jwt.sign(
      { adminId: admin._id, name: admin.name },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.KEY_LIFE }
    );
    return { token, name: admin.name };
  }
}

class AdminOtp {
  static async createOtp(reqBody) {
    const { email, reset, secret } = reqBody;
    const admin = await Admin.findOne({ email });
    if (!reset) {
      if (admin) {
        throw new BadRequestError("Email already exsist");
      }
    }
    if (reset) {
      if (!admin) {
        throw new BadRequestError("No account found with that email");
      }
    }
    let otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const count = await OTP.countDocuments({ email });

    if (count > 10) {
      throw new BadRequestError(
        "Multiple otp request failed. Please try after 1hr"
      );
    }
    if (secret !== process.env.ADMIN_ACCESS_PASSWORD) {
      throw new BadRequestError("No valid access key");
    }
    await OTP.create({ email, otp });
    return { success: true, message: "OTP send successfully" };
  }

  static async verifyOtp(reqBody) {
    const { otp, email } = reqBody;
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (response.length === 0) {
      // OTP not found for the email
      throw new BadRequestError("Not valid OTP ");
    } else if (otp !== response[0].otp) {
      // Invalid OTP
      throw new UnauthorizedError("Invalid OTP");
    }
    return { success: true, message: "Email verified successfully" };
  }
}

module.exports = { AdminAuthentication, AdminOtp };
