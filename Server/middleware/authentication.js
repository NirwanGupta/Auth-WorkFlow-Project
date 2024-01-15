const { custom } = require("joi");
const customError = require(`../errors`);
const {isTokenValid} = require(`../utils`);
const Token = require(`../models/token`);
const {attachCookiesToResponse} = require(`../utils`);

const authenticateUser = async (req, res, next) => {
    const { refreshToken, accessToken } = req.signedCookies;

    try {
        if(accessToken) {
            const payload = isTokenValid(accessToken);
            // console.log(payload.user);
            req.user = payload.user;
            return next();
        }
        //  this means that the accessToken had already expired and thus now we are going to check for the refreshToken

        const payload = isTokenValid(refreshToken);

        const existingToken = await Token.findOne({
            user: payload.user.userId,
            refreshToken: payload.refreshToken,
        });

        if(!existingToken || !existingToken?.isValid) {  //  the refreshToken also expired or the isValid of the refreshToken was set false by the admin intentionally
            throw new customError.UnauthenticatedError(`Authentication Invalid`);
        }

        attachCookiesToResponse({ res, user: payload.user, refreshToken: existingToken.refreshToken });

        req.user = payload.user;
        next();

    } catch (error) {
        throw new customError.UnauthenticatedError(`Authentication Invalid`);
    }
}

//  this authorisePermission is hardcoded for single role only
/*
const authorisePermission = (req, res, next) => {
    // console.log(req.user.role);
    if(req.user.role !== 'admin') {
        throw new customError.UnauthoriseError(`Unauthorised to access this route`);
    }
    next();
}
*/

const authorisePermission = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            throw new customError.UnauthoriseError(`Unauthorized to access this route`);
        }
        next();
    }
}

module.exports = {
    authenticateUser,
    authorisePermission,
}