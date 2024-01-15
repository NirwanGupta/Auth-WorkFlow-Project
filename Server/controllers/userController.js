const User = require(`../models/user`);
const customError = require(`../errors`);
const {StatusCodes} = require(`http-status-codes`);
const {attachCookiesToResponse, createTokenUser, checkPermissions} = require(`../utils`);

const getAllUser = async(req, res) => {
    console.log(req.user);
    const users = await User.find({role: `user`}).select(`-password`);
    res.status(StatusCodes.OK).json({users});
}

const getSingleUser = async (req, res) => {
    const {id: userId} = req.params;
    const user = await User.findOne({_id: userId}).select(`-password`);
    if(!user) {
        throw new customError.NotFoundError(`No user found`);
    }
    checkPermissions(req.user, user._id);  //   req.user is the current user and user._id id the id of the user that i wanted to get
    res.status(StatusCodes.OK).json({user});
}

const showCurrentUser = async (req, res) => {
    res.status(StatusCodes.OK).json({user: req.user});
}

const updateUser = async (req, res) => {
    //  only name and email are to be updated
    const {name, email} = req.body;

    if(!name || !email) {
        throw new customError.BadRequestError(`Please provide email and name`);
    }

    const user = await User.findOneAndUpdate(
        {_id: req.user.userId},
        {name, email},
        {new: true, runValidators: true},
    );

    const tokenUser = createTokenUser(user);
    attachCookiesToResponse({res, user: tokenUser});

    res.status(StatusCodes.OK).json({user: tokenUser});
}

const updateUserPassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) {
        throw new customError.BadRequestError(`Please provid new and old passwords`);
    }

    const user = await User.findOne({_id: req.user.userId});
    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if(!isPasswordCorrect) {
        throw new customError.UnauthenticatedError(`Invalid credentials`);
    }

    user.password = newPassword;
    await user.save();  //  invokes the pre(`save`)

    res.status(StatusCodes.OK).json({msg: `Password updated!!`});
}

module.exports = {
    getAllUser,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
};