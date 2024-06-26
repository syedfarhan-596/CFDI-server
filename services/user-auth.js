const User = require("../models/user");
const TempUser = require("../models/temp-user");
const { BadRequestError, UnauthorizedError } = require("../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const OTP = require("../models/OTP");
const SendMail = require("../nodemailer");

class UserOtp {
  static async createOtp(reqBody) {
    const { email } = reqBody;

    let otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await OTP.create({ email, otp });
    SendMail(
      email,
      "OTP verification",
      `Your otp to verify for code for digital india is ${otp}`,
      "<b>Do not share this otp with anyone. Only valid for next 1hr</b>"
    );
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

class UserAuthentication {
  static async createTempUser(reqBody, reqFile, fileName) {
    const { password, email } = reqBody;
    const user = await User.findOne({ email });
    if (user) {
      throw new BadRequestError("User Already Exsist");
    }
    const tempUser = await TempUser.findOne({ email });
    if (tempUser) {
      return { redirect: true };
    } else {
      const salt = await bcrypt.genSalt(10);
      reqBody.password = await bcrypt.hash(password, salt);
      if (reqFile) {
        reqBody.resume = fileName;
      }
      await TempUser.create(reqBody);
    }

    return { redirect: false };
  }
  static async createUser(reqBody) {
    const { email } = reqBody;
    const tempUser = await TempUser.findOne({ email }).select(
      "email password resume number name internshipDomain status"
    );
    if (!tempUser) {
      throw new BadRequestError(
        "something went wrong, Trying creating account later"
      );
    }
    const tempUserData = tempUser.toObject();
    const user = await User.create(tempUserData);
    await TempUser.findOneAndDelete({ email });
    const token = jwt.sign(
      { userId: user._id, name: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.KEY_LIFE }
    );

    return { token, name: user.fullName };
  }

  static async loginUser(reqBody) {
    const { email, password } = reqBody;
    if (!email || !password) {
      throw new BadRequestError("Please provide email and password");
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new BadRequestError(
        `No user found with ${email}, Please check and try again  `
      );
    }
    const passwordVerified = await bcrypt.compare(password, user.password);
    if (!passwordVerified) {
      throw new UnauthorizedError("Invalid Email or Password try again");
    }

    const token = jwt.sign(
      { userId: user._id, name: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.KEY_LIFE }
    );

    return { token, name: user.fullName };
  }

  static async resetPassword(reqBody) {
    const { email, password } = reqBody;
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);
    await User.findOneAndUpdate({ email }, { password: hashPass });
    return { message: "Password updated successfully" };
  }
}

module.exports = { UserAuthentication, UserOtp };
