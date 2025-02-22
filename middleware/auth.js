import jwt from "jsonwebtoken"


//  ** auth middleware **
export default async function Auth(req, res, next){
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(" ")[1];

        // retrieve the user details for the logged in User
        req.user = await jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);

        // res.json(decodeToken);
        next();
    }
    catch(error){
        res.status(401).json({error: "Authentication Failed"})
    }
}


export function localVariables(req, res, next){
    req.app.locals = {
        OTP: null,
        resetSession: false
    }
    next();
}