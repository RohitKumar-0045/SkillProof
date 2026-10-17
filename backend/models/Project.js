const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        user: {
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

        technologies: [
            {
                type: String
            }
        ],

        githubUrl: {
            type: String,
            trim: true,
            default: ""
        },

        githubRepo: {
            id: {
                type: String,
                default: ""
            },

            name: {
                type: String,
                default: ""
            },

            fullName: {
                type: String,
                default: ""
            },

            url: {
                type: String,
                default: ""
            }
        },

        liveUrl: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model(
    "Project",
    projectSchema
);

module.exports = Project;