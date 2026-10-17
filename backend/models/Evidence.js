const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        skillName: {
            type: String,
            required: true,
            trim: true
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },

        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            default: null
        },

        type: {
            type: String,
            enum: [
                "github",
                "project",
                "assignment",
                "assessment",
                "certificate"
            ],
            required: true
        },

        source: {
            repositoryId: {
                type: String,
                default: ""
            },

            repositoryName: {
                type: String,
                default: ""
            },

            repositoryUrl: {
                type: String,
                default: ""
            },

            url: {
                type: String,
                default: ""
            }
        },

        status: {
            type: String,
            enum: [
                "pending",
                "analyzing",
                "analyzed",
                "verified",
                "rejected"
            ],
            default: "pending"
        },

        aiAnalysis: {
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

            technologiesDetected: {
                type: [String],
                default: []
            },

            analyzedAt: {
                type: Date,
                default: null
            }
        },

        verification: {
            status: {
                type: String,
                enum: [
                    "pending",
                    "verified",
                    "needs_review",
                    "rejected"
                ],
                default: "pending"
            },

            reason: {
                type: String,
                default: ""
            },

            verifiedAt: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

const Evidence =
    mongoose.models.Evidence ||
    mongoose.model("Evidence", evidenceSchema);

module.exports = Evidence;