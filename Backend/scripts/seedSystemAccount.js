const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");

async function seedSystemAccount() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

        // Find the existing system user
        const systemUser = await userModel.findOne({
            systemUser: true
        });

        if (!systemUser) {
            throw new Error(
                "System user not found. Create the system user first."
            );
        }

        console.log("System user found:", systemUser._id.toString());

        // Check whether system account already exists
        let systemAccount = await accountModel.findOne({
            user: systemUser._id
        });

        if (systemAccount) {
            console.log(
                "System account already exists:",
                systemAccount._id.toString()
            );
        } else {
            // Create system account
            systemAccount = await accountModel.create({
                user: systemUser._id
            });

            console.log(
                "System account created:",
                systemAccount._id.toString()
            );
        }

        console.log("\n=================================");
        console.log("SYSTEM_ACCOUNT_ID=");
        console.log(systemAccount._id.toString());
        console.log("=================================\n");

    } catch (error) {
        console.error("System account seed failed:");
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedSystemAccount();