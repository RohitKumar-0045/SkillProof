const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        resume: {
            url: {
                type: String,
                default: ""
            },
        publicId: {
            type: String,
            default: ""
        },
        resourceType: {
            type: String,
            default: "raw"
        },
            fileName: {
                type: String,
                default: ""
            }
        },

        coverLetter: {
            type: String,
            default: "",
            trim: true
        },

        status: {
            type: String,
            enum: [
                "applied",
                "shortlisted",
                "rejected",
                "selected",
                "withdrawn"
            ],
            default: "applied"
        },

        appliedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

jobApplicationSchema.index(
    { job: 1, student: 1 },
    { unique: true }
);

const JobApplication =
    mongoose.models.JobApplication ||
    mongoose.model(
        "JobApplication",
        jobApplicationSchema
    );

module.exports = JobApplication;
