const mongoose = require("mongoose");

const savedCandidateSchema = new mongoose.Schema(
    {
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

savedCandidateSchema.index(
    { recruiter: 1, student: 1 },
    { unique: true }
);

const SavedCandidate =
    mongoose.models.SavedCandidate ||
    mongoose.model("SavedCandidate", savedCandidateSchema);

module.exports = SavedCandidate;