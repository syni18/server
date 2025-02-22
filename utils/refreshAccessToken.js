import RefreshTokenModel from "../model/RefreshToken.model.js";
import UserModel from "../model/User.model.js";
import generateJWT from "./generateJWT.js";
import verifyRefreshToken from "./verifyRefreshToken.js";

const refreshAccessToken = async (req, res ) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        const { tokenDetails, error, msg } = await verifyRefreshToken(oldRefreshToken);
        if (error) {
            return res.status(401).send({status: "failed", msg: msg})
        }

        const getUser = await UserModel.findById(tokenDetails._id);
        if(!getUser) {
            return res.status(401).send({status: "failed", msg: "User not found"})
        }

        const userRefreshToken = await RefreshTokenModel.findOne({userId: tokenDetails._id});
        if(oldRefreshToken !== userRefreshToken.token || userRefreshToken.blackList) {
            return res.status(401).send({status: "failed", msg: "Unauthorized access"})
        }

        const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = await generateJWT(getUser);
        return {
            newAccessToken: accessToken,
            newRefreshToken: refreshToken,
            newAccessTokenExpiry: accessTokenExpiry,
            newRefreshTokenExpiry: refreshTokenExpiry
        }
    } catch (error) {
        console.error(error);
        return res.status(401).json({ msg: "Invalid refresh token" });
    }
}

export default refreshAccessToken;