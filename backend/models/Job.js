const mongoose = require("mongoose");


const jobSchema = mongoose.Schema({
    recruiter: {
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
    location: {
        type: String,
        default: "Remote",
        trim: true
    },
    employmentType: {
        type: String,
        enum: [
            "Full-time",
            "Part-time",
            "Internship",
            "Contract"
        ],
        default: "Full-time"
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
        default: "published"
    }
},
    {
        timeStamps: true

    })
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

module.exports = Job;