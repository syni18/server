import jwt from "jsonwebtoken";
import RefreshTokenModel from "../model/RefreshToken.model.js";

const verifyRefreshToken = async (refreshToken) => {
    try {
        const key = process.env.JWT_REFRESH_SECRET_KEY;

        const userRefreshToken = await RefreshTokenModel.findOne({token: refreshToken});
        if(!userRefreshToken){
            throw new Error("Invalid refresh token");
        }

        // verify details
        const tokenDetails = jwt.verify(refreshToken, key);
        return {
            tokenDetails,
            error: false,
            msg: "Valid refresh token"
        }
    } catch (error) {
        throw {error: true, msg: "Invalid refresh token"};
    }
}

export default verifyRefreshToken;