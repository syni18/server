import jwt from "jsonwebtoken";
import RefreshTokenModel from "../model/RefreshToken.model.js";

const generateJWT = async (user) => {
    try {
        console.log("generate JWT called");
        const payload = {_id: user._id, ...user};
        
        const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY // expire in 900 seconds
        const accessToken = jwt.sign({
            ...payload,
            },
            process.env.JWT_ACCESS_SECRET_KEY,
            {expiresIn: '900s'}
        );

        const refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY// expire in 5 days
        const refreshToken = jwt.sign({
            ...payload,
            },
            process.env.JWT_REFRESH_SECRET_KEY,
            {expiresIn: '5d'}
        );

        // existence checking in DB
        const isRefreshTokenExist = await RefreshTokenModel.findOne({userId: user._id});
        if(isRefreshTokenExist) {
            await RefreshTokenModel.deleteOne({userId: user._id});
        }
        //save new
        await new RefreshTokenModel({
            userId: user._id,
            token: refreshToken,
            expiry: refreshTokenExpiry,
        }).save();

        return {
          accessToken,
          refreshToken,
          accessTokenExpiry: accessTokenExpiry,
          refreshTokenExpiry: refreshTokenExpiry // 5 days
        };
    } catch (err) {
        return Promise.reject(err);
    }
}

export default generateJWT;