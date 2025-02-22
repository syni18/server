import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from "bcrypt";
import passport from 'passport';;
import UserModel from '../model/User.model.js';
import generateJWT from '../utils/generateJWT.js';
import * as dotenv from "dotenv";
dotenv.config();
passport.use( new GoogleStrategy(
    {  
        clientID: process.env.GCLOUD_CLIENT_ID,
        clientSecret: process.env.GCLOUD_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_BASE_URL}/v1/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let isUserExist = await UserModel.findOne({ email: profile._json.email });
            if(!isUserExist) {
                 const password = generatePassword(
                   profile._json.given_name,
                   profile._json.family_name
                 );

                isUserExist = await UserModel.create({
                  fullname: profile._json.name,
                  firstname: profile._json.given_name,
                  lastname: profile._json.family_name,
                  avatar: profile._json.picture,
                  googleId: profile._json.sub,
                  email: profile._json.email,
                  password: await bcrypt.hash(password, 10), // Placeholder password
                  decryptPassword: password, // Placeholder password
                  isActive: true, // Set isActive to true by default
                  isAdmin: false, // Set isAdmin to false by default
                });
                isUserExist.userId = isUserExist._id;
                await isUserExist.save();
            }
            // generate Token JWT
            const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = await generateJWT(isUserExist);
            return done(null, {isUserExist, accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry})
        } catch(err) {
            console.error('Error fetching user profile:', err);
            return done(err);
        }
    }));

    // Function to generate a password
function generatePassword(firstname, lastname) {
  const specialCharacter = "@"; // You can choose any special character
  const numericValues = Math.floor(100 + Math.random() * 900).toString(); // Generates a random 3-digit number

  // Function to generate a random string of specified length
  const generateRandomString = (length) => {
    const characters = process.env.CHARACTERS;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Get the first 3 characters of the firstname
  let firstPart = firstname.substring(0, 3);
  if (firstPart.length < 3) {
    firstPart += generateRandomString(3 - firstPart.length); // Append random string if less than 3 characters
  }

  // Get the first 3 characters of the lastname if it exists
  let lastPart = lastname ? lastname.substring(0, 3) : "";
  if (lastPart.length < 3) {
    lastPart += generateRandomString(3 - lastPart.length); // Append random string if less than 3 characters
  }

  return `${firstPart}${lastPart}${specialCharacter}${numericValues}`;
}