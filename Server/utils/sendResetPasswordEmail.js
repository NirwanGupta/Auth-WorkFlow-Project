const sendEmail = require(`./sendEmail`);
const sendResetPasswordEmail = async ({name, email, token, origin}) => {
    const resetURL = `${origin}/user/reset-password?token=${token}&email=${email}`;
    const message = `<p>Click on the given link to reset your password: <a href="${resetURL}">Reset Password</a></p>`;

    return sendEmail({
        to: email,
        subject: `Reset Email`,
        html: `<h4>Hello ${name}</h4><br>${message}`,
    })
}

module.exports = sendResetPasswordEmail;