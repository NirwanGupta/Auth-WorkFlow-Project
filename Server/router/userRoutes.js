const express = require(`express`);
const router = express.Router();
const {authenticateUser, authorisePermission} = require(`../middleware/authentication`);

const {
    getAllUser,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword, 
} = require(`../controllers/userController`);

router.route('/').get(authenticateUser, authorisePermission('admin'), getAllUser);

router.route('/showMe').get(authenticateUser, showCurrentUser);
router.route(`/updateUser`).patch(authenticateUser, updateUser);
router.route(`/updateUserPassword`).patch(authenticateUser, updateUserPassword);

router.route(`/:id`).get(authenticateUser, getSingleUser);    //  this should be set below the showCurrentUser because, if it is set above then showMe will be treated as id, that is not what i wanted

module.exports = router;