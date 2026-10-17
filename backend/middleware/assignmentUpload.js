const multer = require("multer");

const storage = multer.memoryStorage();

const allowedExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".html",
    ".css",
    ".json",
    ".txt",
    ".zip"
];

const fileFilter = (req, file, cb) => {
    const fileName = file.originalname.toLowerCase();

    const isAllowed = allowedExtensions.some(
        (extension) => fileName.endsWith(extension)
    );

    if (isAllowed) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Unsupported file type. Please upload a supported code file or ZIP project."
            ),
            false
        );
    }
};

const assignmentUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter
});

module.exports = assignmentUpload;