const User = require("../models/user");
const Admin = require("../models/admin");
const { UnauthorizedError, BadRequestError } = require("../errors");
const SendMail = require("../nodemailer");
const { statusChange } = require("./email-messages");

const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
  },
  region: bucketRegion,
});

const deleteFileFromS3 = async (fileName, folder) => {
  if (!fileName) return;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `uploads/${folder}/${fileName}`,
  };

  const command = new DeleteObjectCommand(params);
  await s3.send(command);
};

class AdminOperations {
  static buildQueryObject(status) {
    let queryObject = {};
    switch (status) {
      case "offerLetter":
        queryObject = { "status.offerLetter": { $exists: false } };
        break;
      case "taskPending":
        queryObject = {
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
        break;
      case "verification":
        queryObject = {
          $and: [
            { "status.offerLetter": { $exists: true } },
            { "status.tasks": { $exists: true, $ne: [] } },
            { "status.taskSubmission": { $exists: true, $ne: [] } },
            { "status.taskVerified": false },
          ],
        };
        break;
      case "certificate":
        queryObject = {
          $and: [
            { "status.offerLetter": { $exists: true } },
            { "status.tasks": { $exists: true, $ne: [] } },
            { "status.taskSubmission": { $exists: true, $ne: [] } },
            { "status.taskVerified": true },
            { "status.completionCertificate": { $exists: false } },
          ],
        };
        break;
      default:
        break;
    }
    return queryObject;
  }

  static async getUsers(reqQuery) {
    const { internshipStatus, page = 1, email, internshipDomain } = reqQuery;
    const queryObject = this.buildQueryObject(internshipStatus);

    if (internshipDomain) {
      queryObject.internshipDomain = {
        $regex: internshipDomain,
        $options: "i",
      };
    }
    if (email) {
      queryObject.email = { $regex: email, $options: "i" };
    }

    const skip = 10 * (page - 1);
    const users = await User.find(queryObject)
      .select("-password")
      .limit(10)
      .skip(skip)
      .sort("createdAt");
    const count = await User.countDocuments(queryObject);

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

      let user = await User.findById(userId).select("-password");

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
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const fileExtension = reqFile?.offerletter[0].originalname
              .split(".")
              .pop();
            const fileName = `${reqFile.offerletter[0].fieldname}-${uniqueSuffix}.${fileExtension}`;

            const params = {
              Bucket: bucketName,
              Key: `uploads/offerletter/${fileName}`,
              Body: reqFile.offerletter[0].buffer,
              ContentType: reqFile.offerletter[0].mineType,
            };

            const command = new PutObjectCommand(params);
            await s3.send(command);

            user.status.offerLetter = fileName;
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
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const fileExtension = reqFile.certificate[0].originalname
              .split(".")
              .pop();
            const fileName = `${reqFile.certificate[0].fieldname}-${uniqueSuffix}.${fileExtension}`;

            const params = {
              Bucket: bucketName,
              Key: `uploads/certificate/${fileName}`,
              Body: reqFile.certificate[0].buffer,
              ContentType: reqFile.certificate[0].mineType,
            };

            const command = new PutObjectCommand(params);
            await s3.send(command);

            user.status.completionCertificate = fileName;
          } else {
            throw new BadRequestError("Error file recieved");
          }
          break;

        default:
          return { success: false, message: "something went wrong" };
      }

      await user.save();
      SendMail(user?.email, subjectMessage, emailMessage, statusChange);

      return { success: true, message: "Done", user };
    } catch (error) {
      return { success: false, message: "something went wrong" };
    }
  }
  static async deleteStatus(reqParams) {
    const { status, userId } = reqParams;

    const unsetFields = {};

    let user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError("No user found, Something went wrong");
    }

    switch (status) {
      case "offer":
        unsetFields["status.offerLetter"] = "";
        unsetFields["status.startDate"] = "";
        unsetFields["status.submissionDeadline"] = "";
        await deleteFileFromS3(user.status.offerLetter, "offerletter");
        break;

      case "task":
        unsetFields["status.tasks"] = "";
        break;

      case "verification":
        unsetFields["status.taskVerified"] = "";
        break;

      case "certificate":
        unsetFields["status.completionCertificate"] = "";
        await deleteFileFromS3(
          user.status.completionCertificate,
          "certificate"
        );
        break;

      case "submittedtask":
        unsetFields["status.taskSubmission"] = "";
        break;

      default:
        throw new BadRequestError("Invalid status type");
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $unset: unsetFields },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      throw new BadRequestError("No user found, Something went wrong");
    }

    return { user: updatedUser };
  }

  static async deleteUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new BadRequestError("No user found, Something went wrong");
    }

    // Delete associated files from S3
    await deleteFileFromS3(user.status.offerLetter, "offerletter");
    await deleteFileFromS3(user.status.completionCertificate, "certificate");
    await deleteFileFromS3(user.resume, "resume");

    // Delete the user from the database
    await User.deleteOne({ _id: userId });

    return { userId };
  }
}

module.exports = { AdminOperations };
