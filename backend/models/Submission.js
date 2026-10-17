const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        attemptNumber: {
            type: Number,
            default: 1,
            min: 1,
            max: 3
        },

        file: {
            url: {
                type: String,
                required: true
            },
            publicId: {
                type: String,
                required: true
            },
            fileName: {
                type: String,
                required: true
            },
            fileType: {
                type: String,
                default: ""
            },
            fileSize: {
                type: Number,
                default: 0
            }
        },

        submittedAt: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: [
                "submitted",
                "analyzing",
                "evaluated",
                "reviewed"
            ],
            default: "submitted"
        },

        aiEvaluation: {
            score: {
                type: Number,
                default: 0
            },
            summary: {
                type: String,
                default: ""
            },
            strengths: {
                type: [String],
                default: []
            },
            weaknesses: {
                type: [String],
                default: []
            },
            suggestions: {
                type: [String],
                default: []
            },
            evaluatedAt: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

const Submission =
    mongoose.models.Submission ||
    mongoose.model("Submission", submissionSchema);

module.exports = Submission;

module.exports = Submission;