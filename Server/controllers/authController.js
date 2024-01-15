require(`dotenv`).config();
const User = require(`../models/user`);
const Token = require(`../models/token`);
const {StatusCodes} = require(`http-status-codes`);
const customError = require(`../errors`);
const jwt = require(`jsonwebtoken`);
const {
    attachCookiesToResponse, 
    createTokenUser, 
    sendVerificationEmail, 
    sendResetPasswordEmail, 
    createHash,
} = require(`../utils`);

const crypto = require(`crypto`);
const { custom } = require("joi");

const register = async (req, res) => {
    
   //  unique email check if done in controller, not to be done if not in UserSchema
    const {email, name, password} = req.body;   //  we want the role not to be sent rest all to be sent here, so extract
    const emailExists = await User.findOne({email});
    if(emailExists) {
        throw new customError.BadRequestError(`Email is already registered`);
    }
    
    //  one way can be to make First user as admin
    const isFirstAccount = await User.countDocuments({}) === 0;
    const role = isFirstAccount? 'admin': 'user';
    
    const verificationToken = crypto.randomBytes(40).toString("hex");   //  generates 40random bits and convert them to hexadecimal
    
    const user = await User.create({name, email, password, role, verificationToken});

    const origin = `http://localhost:3000`;
    // const newOrigin = `https://react-node-user-workflow-front-end.netlify.app`;

    const tempOrigin = req.get(`origin`);   //  this is the origin of the backend that i get from the req object
    console.log(`origin: ${tempOrigin}`);
    const protocol = req.protocol;
    console.log(`protocol: ${protocol}`);
    const host = req.get(`host`);
    console.log(`host: ${host}`);

    const forwardedHost = req.get(`x-forwarded-host`);
    console.log(`forwarded host: ${forwardedHost}`);
    const forwardedProtocol = req.get(`x-forwarded-proto`);
    console.log(`Forwarded Protocol: ${forwardedProtocol}`);
    
    await sendVerificationEmail({email: user.email, name: user.name, verificationToken: user.verificationToken, origin});

    //  only sending the second token while testing in postman
    res.status(StatusCodes.CREATED).json({
        msg: `Success!! please verify your email account`,
    });
}

const verifyEmail = async (req, res) => {
    const {verificationToken, email} = req.body;

    const user = await User.findOne({email});
    if(!user) {
        throw new customError.UnauthenticatedError(`Verificatin Failed`);
    }
    if(user.verificationToken !== verificationToken) {
        throw new customError.UnauthenticatedError(`Verificatin Failed`);
    }

    user.isVerified = true;
    user.verified = Date.now();
    user.verificationToken = '';

    await user.save();

    res.status(StatusCodes.OK).json({msg: 'Email Verified'});
}

const login = async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        throw new customError.BadRequestError(`Please provide email and password`);
    }

    // console.log(password);

    const user = await User.findOne({ email });
    if(!user) {
        throw new customError.UnauthenticatedError(`No user registered with email ${email}`);
    }

    const isPasswordCorrect = await user.comparePassword(password);
    // console.log(isPasswordCorrect);
    if(!isPasswordCorrect) {
        throw new customError.UnauthenticatedError(`Wrong password`);
    }

    if(!user.isVerified) {
        throw new customError.UnauthenticatedError(`Please verify your email account`);
    }

    const tokenUser = createTokenUser(user);
    //create refresh token
    let refreshToken ='';

    //  check for existing token
    const existingToken = await Token.findOne({ user: user._id });
    if(existingToken) { //  this is done in order to ensure that if a user login multiple times, the token is not stored in the dataBase everyTime. If he has logged in once and the token is still alive then use that token to login 
        const {isValid} = existingToken;
        if(!isValid) {  //  if the user is doing something that i strictly doesnot want him to do, somehow i create the isValid to false and thus we throw the following error and ensure that the user will not be able to login
            throw new customError.UnauthenticatedError(`Your account has been banned`);
        }
        refreshToken = existingToken.refreshToken;
        attachCookiesToResponse({res, user: tokenUser, refreshToken});
        res.status(StatusCodes.OK).json({ user: tokenUser });
        return;
    }

    refreshToken = crypto.randomBytes(40).toString('hex');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = { refreshToken, ip, userAgent, user:user._id };

    await Token.create(userToken);

    attachCookiesToResponse({res, user:tokenUser, refreshToken});
    res.status(StatusCodes.OK).json({ user : tokenUser });
}

const logout = async (req, res) => {
    await Token.findOneAndDelete({ user: req.user.userId });

    res.cookie(`accessToken`, 'AccessTokenLogout', {
        httpOnly: true,
        expires: new Date(Date.now() /*+ 5*1000*/),
    })

    res.cookie(`refreshToken`, 'RefreshTokenLogout', {
        httpOnly: true,
        expires: new Date(Date.now() /*+ 5*1000*/),
    })

    res.status(StatusCodes.OK).json({msg: 'user logged out'});
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if(!email) {
        throw new customError.BadRequestError(`Please provide email ID`);
    }
    const user = await User.findOne({email});
    //  i donot want to throw an error if the email is not present in my database, becaue if i do so attackers can know what email i have in my dataBase
    if(user) {
        //  i want to create a token that has an expiry date in 10 minutes so that the user cannot use the reset password link for more than 10 minutes
        const passwordToken = crypto.randomBytes(70).toString(`hex`);

        //  send email
        const origin = `http://localhost:3000`;
        await sendResetPasswordEmail({name: user.name, email: user.email, token: passwordToken, origin});

        const tenMinutes = 1000*60*10;
        const passwordTokenExpirationDate = new Date(Date.now()+tenMinutes);

        user.passwordToken = createHash(passwordToken);
        user.passwordTokenExpirationDate = passwordTokenExpirationDate;

        await user.save();
    }
    res.status(StatusCodes.OK).json({msg: `Please check your email for reset password link`});
}

const resetPassword = async (req, res) => {
    const {email, token, password} = req.body;  //  email and token are passed as query strings and they are set to the req.body through frontend
    if(!email || !token || !password) {
        throw new customError.BadRequestError(`Please provide all the values`);
    }
    const user = await User.findOne({email});
    //  even if the email doesnot exist we need to send 200 so that attacker doesnot know what emails i have in my database
    if(user) {
        const currentDate = new Date();

        // console.log('Expiration Time:', user.passwordTokenExpirationDate);
        // console.log('Current Time:', currentDate);
        // console.log('user.passwordToken: ', user.passwordToken);
        // console.log('token: ', token);

        if(user.passwordToken === createHash(token) && user.passwordTokenExpirationDate > currentDate) {
            user.password = password;
            user.passwordToken = null;
            user.passwordTokenExpirationDate = null;
            // console.log('New password is: ', user.password, "\nthe password entered was: ",password);
            await user.save();
        }
    }
    res.status(StatusCodes.OK).json({msg: 'Password changed successfully'});
}

module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
};