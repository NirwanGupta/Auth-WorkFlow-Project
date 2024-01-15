require('dotenv').config();
const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
};
  
const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

//user==tokenUser
//  the accessToken is generated and has the user identity after the user authorization, the short life spam mainly helps for the case of token compromize. Although sometinme a token may be compromized by some unauthenticated user, but after 15 minutes the accessToken expires and new accessToken is generated. This all is done till the refreshToken expires
//  The main purpose of the refreshToken is the creating of the new accessTokens
const attachCookiesToResponse = ({res, user, refreshToken})=>{
    const accessTokenJWT = createJWT({ payload: { user } });   //  the accessToken is short lived and should have a life of around 15-20 min
    const refreshTokenJWT = createJWT({ payload: { user, refreshToken } }); //  the refreshTokenJWT along with user info also has the refreshToken. The refreshTokenJWT is mainly long lived and has alife of about 30-60 days

    // console.log(user);

    const oneDay = 1000*60*60*24;
    const thirtyDays = 1000*60*60*24*30;
    //  const fiveSeconds = 1000*5;

    res.cookie('accessToken',accessTokenJWT,{
        httpOnly:true,
        // expires: new Date(Date.now()+oneDay),
        secure : process.env.NODE_ENV === 'production',
        signed: true,    // to check that the user can not manually modify the cookie in the browser, so we send it signed with some value in cookieParser
        expires: new Date(Date.now() + oneDay),
    });

    res.cookie(`refreshToken`, refreshTokenJWT, {
        httpOnly: true,
        expires: new Date(Date.now() + thirtyDays),
        secure: process.env.NODE_ENV === 'production',
        signed: true,
    });
}

/*
const attachCsingleookieToResponse = ({res,user})=>{
    const token = createJWT({payload:user});
    // console.log(user);

    const oneDay = 1000*60*60*24;

    res.cookie('token',token,{
        httpOnly:true,
        expires: new Date(Date.now()+oneDay),
        secure : process.env.NODE_ENV==='production',
        signed: true,    // to check that the user can not manually modify the cookie in the browser, so we send it signed with some value in cookieParser
    })
}
*/

module.exports ={createJWT,isTokenValid,attachCookiesToResponse};