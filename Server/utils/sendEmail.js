const nodemailer = require("nodemailer");
const nodemailerConfig = require(`./nodemailerConfig`);

const sendEmail = async ({to, subject, html}) => {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport(nodemailerConfig);

    return transporter.sendMail({   //  this return value is being awaited in the authController in the resister await sendEmail, -> thus no need to write await here
        from: '"NIT KKR", <director@nitkkr.ac.in>',
        to,
        subject,
        html,
      });
}

module.exports = sendEmail;