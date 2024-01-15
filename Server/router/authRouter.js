const express = require(`express`);
const router = express.Router();
const { authenticateUser } = require(`../middleware/authentication`);

const {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
} = require(`../controllers/authController`);

router.route(`/register`).post(register);
router.route(`/login`).post(login);
router.route(`/logout`).delete(authenticateUser, logout);   //  because i am deleting the token from the database
router.route(`/verify-email`).post(verifyEmail);    //  verify-email has to be a post request for security reasons
router.route(`/forgot-password`).post(forgotPassword);
router.route(`/reset-password`).post(resetPassword);

module.exports = router;