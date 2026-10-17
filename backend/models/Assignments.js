const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        skills: [
            {
                type: String,
                trim: true
            }
        ],
        difficulty: {
            type: String,
            enum: [
                "Easy",
                "Medium",
                "Hard"
            ],
            default: "Easy"
        },

        deadline: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: [
                "draft",
                "published",
                "closed"
            ],
            deafault: "published"
        }
    },
    {
        timestamps: true
    }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;