const User = require("../models/user");
const Admin = require("../models/admin");
const { UnauthorizedError, BadRequestError } = require("../errors");
const SendMail = require("../nodemailer");
const { statusChange } = require("./email-messages");
class AdminOperations {
  static async getUsers(reqQuery) {
    let QueryObject = {};
    const { internshipStatus, page, email, internshipDomain } = reqQuery;
    if (internshipStatus === "offerletter") {
      QueryObject = {
        "status.offerLetter": { $exists: false }, // or null if you're sure it's always null, otherwise use { $in: [null, undefined] }
      };
    }
    if (internshipStatus === "taskallocation") {
      QueryObject = {
        $and: [
          { "status.offerLetter": { $exists: true } },
          {
            $or: [
              { "status.tasks": { $exists: false } },
              { "status.tasks": { $size: 0 } },
            ],
          },
        ],
      };
    }
    if (internshipStatus === "verification") {
      QueryObject = {
        $and: [
          { "status.offerLetter": { $exists: true } },
          { "status.tasks": { $exists: true, $ne: [] } },
          { "status.taskSubmission": { $exists: true, $ne: [] } },
          { "status.taskVerified": false },
        ],
      };
    }
    if (internshipStatus === "certificate") {
      QueryObject = {
        $and: [
          { "status.offerLetter": { $exists: true } },
          { "status.tasks": { $exists: true, $ne: [] } },
          { "status.taskSubmission": { $exists: true, $ne: [] } },
          { "status.taskVerified": true },
          { "status.completionCertificate": { $exists: false } },
        ],
      };
    }
    if (internshipDomain) {
      QueryObject.internshipDomain = {
        $regex: internshipDomain,
        $options: "i",
      };
    }
    if (email) {
      QueryObject.email = {
        $regex: email,
        $options: "i",
      };
    }
    const skip = 10 * (page - 1);

    const users = await User.find(QueryObject)
      .select("-password")
      .limit(10)
      .skip(skip)
      .sort("createdAt");
    const count = await User.countDocuments(QueryObject);

    return { users, count };
  }

  static async getAdmin(req) {
    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      throw new UnauthorizedError("Something went wrong");
    }
    return { admin };
  }

  static async getCount() {
    const total = await User.countDocuments({});

    const completed = await User.countDocuments({
      $and: [
        { "status.offerLetter": { $exists: true } },
        { "status.tasks": { $exists: true } },
        { "status.taskSubmission": { $exists: true } },
        { "status.taskVerified": { $exists: true } },
        { "status.completionCertificate": { $exists: true } },
      ],
    });

    return { total, completed };
  }

  static async getAllAdmin(page = 1) {
    const skip = 20 * (page - 1);
    const admins = await Admin.find({})
      .limit(20)
      .skip(skip)
      .select("-password");
    return { admins };
  }

  static async deleteAdmin(id, secret) {
    if (process.env.ADMIN_SECRET_KEY !== secret) {
      throw new UnauthorizedError("Error key can't delete Admin");
    }
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      throw new BadRequestError("Error admin can't delete");
    }

    return { message: "Deleted successfully" };
  }

  static async getStatistics() {
    const fields = [
      "Web development",
      "Data Science",
      "Andriod app development",
      "Python developer",
      "NodeJS developer",
      "Graphics desining",
    ];
    const pipeline = [
      {
        $match: {
          internshipDomain: { $in: fields }, // Filter documents where internshipDomain is in the specified fields array
        },
      },
      {
        $group: {
          _id: "$internshipDomain", // Group by the internshipDomain field
          count: { $sum: 1 }, // Count documents in each group
        },
      },
    ];

    // Execute the aggregation pipeline
    const data = User.aggregate(pipeline)
      .then((result) => {
        const transformedResult = result.map((entry) => ({
          name: entry._id,
          value: entry.count,
        }));

        return { data: transformedResult };
      })
      .catch((err) => {
        throw err; // Throw error to be caught by the caller
      });
    return data;
  }

  static async getUser(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new BadRequestError("No user with that Id");
    }
    return { user };
  }

  static async updateUser(userId, data, reqFile) {
    try {
      const { type } = data;

      let user = await User.findById(userId);

      if (!user) {
        throw new BadRequestError("No user found");
      }

      let emailMessage = "";
      let subjectMessage = "";

      switch (type) {
        case "offerletter":
          subjectMessage =
            "Update on Internship Status: Offer Letter, Start Date, and Submission Deadline Assigned";
          emailMessage = `Dear ${user?.name?.first} `;

          if (reqFile?.offerletter[0]?.fieldname === "offerletter") {
            user.status.offerLetter = reqFile?.offerletter[0]?.filename;
          } else {
            throw new BadRequestError("Error file recieved");
          }

          if (data.startDate) {
            user.status.startDate = data.startDate;
          }
          if (data.submissionDeadline) {
            user.status.submissionDeadline = data.submissionDeadline;
          }
          break;

        case "tasks":
          emailMessage = "Tasks updated";

          if (data.tasks) {
            user.status.tasks = data.tasks;
          }
          break;

        case "taskVerification":
          emailMessage = "Task verification status updated";

          if (data.taskVerified) {
            user.status.taskVerified = Boolean(data.taskVerified);
          }
          break;

        case "certificate":
          emailMessage = "Certificate updated";

          if (reqFile.certificate[0]?.fieldname === "certificate") {
            user.status.completionCertificate =
              reqFile?.certificate[0]?.filename;
          } else {
            throw new BadRequestError("Error file recieved");
          }
          break;

        default:
          return { success: false, message: "something went wrong" };
      }

      await user.save();
      SendMail(user?.email, subjectMessage, emailMessage, statusChange);

      return { success: true, message: "Done" };
    } catch (error) {
      console.log(error);
      return { success: false, message: "something went wrong" };
    }
  }
}

module.exports = { AdminOperations };
