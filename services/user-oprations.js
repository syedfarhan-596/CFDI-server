const User = require("../models/user");
const { BadRequestError, UnauthorizedError } = require("../errors");
const SendMail = require("../nodemailer");

const bcrypt = require("bcryptjs");

class UserOperations {
  static async getUser(reqUser) {
    const user = await User.findById(reqUser.userId).select("-password");
    if (!user) {
      throw new UnauthorizedError("Invalid token");
    }
    return { user };
  }

  static async updateUser(reqUser, reqBody) {
    if (reqBody.name) {
      const user = await User.findByIdAndUpdate(
        reqUser.userId,
        {
          name: { first: reqBody.name.first, last: reqBody.name.last },
        },
        { new: true }
      ).select("-password");
      SendMail(
        user.email,
        "Profile Updated",
        `<h4>Your profile was updated on ${new Date(
          user?.updatedAt
        ).getDate()}d-${new Date(user?.updatedAt).getMonth()}m-${new Date(
          user?.updatedAt
        ).getFullYear()}</h4>`,
        "<b>Make sure your account is save</b>"
      );
      return { user };
    }
    if (reqBody.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(reqBody.password, salt);
      const user = await User.findByIdAndUpdate(
        reqUser.userId,
        {
          password: hashedPassword,
        },
        { new: true }
      ).select("-password");
      SendMail(
        user.email,
        "Password changed",
        `<h4>Your password was changed on ${new Date(
          user?.updatedAt
        ).getDate()}d-${new Date(user?.updatedAt).getMonth()}m-${new Date(
          user?.updatedAt
        ).getFullYear()}</h4>`,
        "<b>Make sure your account is save</b>"
      );
      return { user };
    }
    if (reqBody.updateUser) {
      console.log(reqBody);
      const user = await User.findByIdAndUpdate(
        reqUser.userId,
        {
          "status.taskSubmission": reqBody.updateUser,
        },
        { new: true }
      ).select("-password");
      console.log(user);
      SendMail(
        user.email,
        "Task submission",
        `<h4>Task submitted successfully on ${new Date(
          user?.updatedAt
        ).getDate()}d-${new Date(user?.updatedAt).getMonth()}m-${new Date(
          user?.updatedAt
        ).getFullYear()}</h4>`,
        "<b>Make sure your account is save</b>"
      );
      return { user };
    }
  }
}

module.exports = { UserOperations };
