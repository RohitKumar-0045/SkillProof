const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendShortlistEmail = async ({
    studentName,
    studentEmail,
    jobTitle
}) => {
    const mailOptions = {
        from: `"SkillProof" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Congratulations! You've been shortlisted for ${jobTitle}`,
        text: `
Hi ${studentName},

Congratulations!

You have been shortlisted for the ${jobTitle} position on SkillProof.

Please log in to SkillProof to check for further updates.

Best regards,
SkillProof Team
        `.trim()
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendShortlistEmail };