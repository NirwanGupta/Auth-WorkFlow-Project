const customErrors = require(`../errors`);

const checkPermissions = (requestUser, resourseUserId) => {
    if(requestUser.role === `admin`)    return;
    //  resourseUserId is a mongoose object, so convert to string
    if(requestUser.userId === resourseUserId.toString())   return;

    throw new customErrors.UnauthoriseError(`Not authorized to access this route`)
}

module.exports = checkPermissions;