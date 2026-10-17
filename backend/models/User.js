const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true
        },

        firstName: {
            type: String,
            required: true
        },

        lastName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true
        },
        // Recruiter and company profile
        designation: {
            type: String,
            default: ""
        },

        companyName: {
            type: String,
            default: ""
        },

        companyWebsite: {
            type: String,
            default: ""
        },

        companyIndustry: {
            type: String,
            default: ""
        },

        companySize: {
            type: String,
            default: ""
        },

        companyDescription: {
            type: String,
            default: ""
        },

        phone: {
            type: String,
            default: ""
        },
        skills: [
            {
                name: String,
                category: String,
                level: String
            }
        ],

        projects: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Project"
                }
            ],
            default: []
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
            },

            uploadedAt: {
                type: Date
            }
        },
        resumeAnalysis: {
            overallScore: {
                type: Number,
                min: 0,
                max: 100,
                default: null
            },

            categoryScores: {
                skills: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: null
                },
                projects: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: null
                },
                education: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: null
                },
                experience: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: null
                },
                formatting: {
                    type: Number,
                    min: 0,
                    max: 100,
                    default: null
                }
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

            analyzedAt: {
                type: Date,
                default: null
            }
        },
        github: {
            id: {
                type: String,
                default: ""
            },

            username: {
                type: String,
                default: ""
            },

            avatarUrl: {
                type: String,
                default: ""
            },

            accessToken: {
                type: String,
                default: ""
            },

            connectedAt: {
                type: Date
            },

            oauthState: {
                type: String,
                default: ""
            },

            oauthStateExpiresAt: {
                type: Date
            }
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
