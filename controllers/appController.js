import bcrypt from "bcrypt";
import passport from "passport";
import { v4 as uuidv4 } from "uuid";
import otpGenerator from "otp-generator";

// model imports
import UserModel from "../model/User.model.js";
import CouponModel from "../model/Coupon.model.js";
import ReviewModel from "../model/Review.model.js";
import ProductModel from "../model/Product.model.js";
import AddressModel from "../model/Address.model.js";
import PancardModel from "../model/Pancard.model.js";
import wishlistsModel from "../model/wishlists.model.js";
import ShoppingBagModel from "../model/ShoppingBag.model.js"
import RecoveryOTPModel from "../model/RecoveryOTP.model.js";
import RefreshTokenModel from "../model/RefreshToken.model.js";

// helper function imports
import { sendEmail } from "./mailer.js";
import generateJWT from "../utils/generateJWT.js";
import generatorOTP from "../utils/generatorOTP.js";
import { otpMessage } from "../utils/designEmail.js";
import setTokenCookies from "../utils/setTokenCookies.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import { decryptionText, encryptionText } from "../encryption/AESencryption.js";

// ** Global variables **
let sessionStore = {}; // Simple in-memory store (replace with Redis or DB for production)

//  ** middleware for verify user **
export async function verifyUser(req, res, next) {
  try {
    const { email } = req.body;

    // check the user existence
    let exist = await UserModel.findOne({ email });
    if (!exist) return res.status(404).send({ error: "Can't find User" });
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

// ** Google sign in **
export async function getAuthGoogle(req, res, next) {
  try {
    // Initiate Google authentication using Passport
    passport.authenticate("google", {
      session: false,
      scope: ["profile", "email"],
    })(req, res, next);
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(500).json({ error: "Failed to authenticate user with Google" });
  }
}

// ** Google callback after sign in **
export async function getCallbackGoogle(req, res, next) {
  passport.authenticate("google", { session: false, failureRedirect: "/login" }, 
    (err, user, info) => {      
      if (err) {
        return next(err); // Handle errors from passport
      }
      console.log("user", user);
      
      if (!user) {
        return res.redirect("/login"); // Handle case where authentication fails
      }

      // Access user details
      const {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      } = user; // Ensure `user` contains these fields

      // Set token cookies
      setTokenCookies(res, accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry);

      // Redirect to the frontend
      console.log("redirecting to frontend");
      
      res.redirect(process.env.FRONTEND_BASE_URL);
    }
  )(req, res, next); // Pass req, res, and next to the passport middleware
}

// ** Generate Authentication tokens and set in cookies **
export async function getNewAccessToken(req, res) {
  try {
    const {
      newAccessToken,
      newRefreshToken, 
      newAccessTokenExpiry, 
      newRefreshTokenExpiry
    } = await refreshAccessToken(req, res);
    // set cookies new
    setTokenCookies(res, newAccessToken, newRefreshToken, newAccessTokenExpiry, newRefreshTokenExpiry);
    res.json({ msg: "New access token generated successfully." });
  } catch(err) {
    console.error("Error: ", err);
    return res.status(500).json({ msg: "Failed to generate new access token." });
  }
}

// ** Signup using email **
export async function register(req, res) {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check for existing user
    const isUserExist = await UserModel.findOne({ email });
    if (isUserExist) {
      return res
        .status(400)
        .json({ status: false, msg: "Email address already exists." });
    }

    // Save user to the database directly
    const result = await new UserModel({
      firstname,
      lastname,
      fullname: lastname ? `${firstname} ${lastname}` : firstname,
      email,
      decryptPassword: password, // Consider removing this for security reasons
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      lastLoginAt: null,
      isActive: true,
      isAdmin: false,
    }).save();

    res.status(201).json({
      status: true,
      userId: result._id,
      msg: "Registered successfully",
    });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({status: false, msg: "Internal server error", details: error.message });
  }
}

// ** SignIn using email **
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const isUserExist = await UserModel.findOne({ email });

    if (!isUserExist) {
      return res.status(404).json({ status: false, msg: "Invalid Email Or Password." });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, isUserExist.password);
    if (!passwordMatch) {
      return res.status(400).json({ status: false, msg: "Invalid Email Or Password." });
    }

    // Create JWT token
    const { 
      accessToken,
      refreshToken, 
      accessTokenExpiry, 
      refreshTokenExpiry 
    } = await generateJWT(isUserExist);

    setTokenCookies(res, accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry);

    // Update lastLoginAt field to current date and time
    isUserExist.lastLoginAt = new Date();
    await isUserExist.save(); // Save the updated user
    
    // Return successful login response with token
    return res.status(200).json({
      status: true,
      msg: "Login successful",
      username: isUserExist.fullname,
      email: isUserExist.email,
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({status: false, msg: "Internal server error" });
  }
}

// ** logout **
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    await RefreshTokenModel.findOneAndUpdate(
      { token: refreshToken },
      { $set: {blacklist: true }}
    );
    //clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    return res.status(200).json({
      status: true,
      msg: "Logout successful",
    });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({status: false, msg: "Logout failed", error: error.message});
  }
}

// ** get current user details **
export async function getUser(req, res, next) {
  try {
    // Send the user data as a response
    res.send({ user: req.user });
  } catch (error) {
    console.error("Error in getUser:", error);
    next(error); // Pass error to global error handler
  }
}

// ** user details using email **
export async function getUserByEmail(req, res) {
  const { email } = req.params;
  console.log(email);

  try {
    if (!email) return res.status(400).send({ error: "Invalid email" });

    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const { password, ...rest } = Object.assign({}, user.toJSON());

    return res.status(200).send(rest);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

// ** profile info update **
export async function updateUserProfile(req, res) {
  try {
    const data = req.body;
    const user = req.user;

    if (!data || data.user._id !== user.userId) {
      console.log("Invalid", data.user._id, user._id);
      
      return res.status(400).send({ error: "Invalid request" });
    }

    const { firstname, lastname, email, phoneNo } = data.values;

    // Check if any field has changed
    if (
      user.firstname === firstname &&
      user.lastname === lastname &&
      user.email === email &&
      user.phoneNo === phoneNo
    ) { return res.status(200).send({ msg: "No changes detected" }) };

    // Construct an object to hold the fields to be updated
    const updateFields = {};

    if (firstname !== user.firstname || lastname !== user.lastname) {
      updateFields.firstname = firstname;
      updateFields.lastname = lastname;
      updateFields.fullname = `${firstname} ${lastname}`;
    }

    if (email !== user.email) updateFields.email = email;
    if (phoneNo !== user.phoneNo) updateFields.phoneNo = phoneNo;

    // Find and update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      { _id: user._id },
      updateFields,
      {
        new: true,
      }
    );

    if (updatedUser) {
      return res
        .status(200)
        .send({ msg: "User  profile updated successfully!", updatedUser });
    } else {
      return res.status(404).send({ error: "User  not found!" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
}

// ** generate OTP **
export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  res.status(201).send({ code: req.app.locals.OTP });
}

// ** verify OTP send by User **
export async function verifyOTP(req, res) {
  try {
    const { email, otp, userId } = req.body;

    const isUserExist = await UserModel.findOne({ email: email});
    const isOTPExist = await RecoveryOTPModel.findOne({userId: userId});

    if (isUserExist && isOTPExist && isOTPExist.userId === userId) {
      if (!isOTPExist.otp === otp.join("")) {
        return res.status(400).send({ error: "Invalid OTP" });
      }
    }
    // delete otp from RecoveryOtpModel
    await RecoveryOTPModel.deleteOne({ userId: userId });

    const sessionId = Date.now().toString(); // Generate session ID
    sessionStore[sessionId] = { isValid: true };

    return res.status(200).send({ msg: `OTP verified successfully!`,SID: sessionId , userId: isUserExist._id});
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
}

//  ** recover account using email **
export async function recovery(req, res, next) {
  try {
    const { email } = req.body;

    const isUserExist = await UserModel.findOne({ email });
    if (!isUserExist) {
      return res
        .status(400)
        .json({ status: false, msg: "Invalid email address." });
    }
    const otp = generatorOTP();

    await RecoveryOTPModel.findOneAndUpdate(
      { userId: isUserExist._id }, // Search condition
      { otp, createdAt: Date.now() }, // Update data
      { upsert: true, new: true } // Upsert and return the updated document
    );

    // send email notification
    // const emailBody = otpMessage(isUserExist.fullname, otp);
    // const subject = `Reset Password`
    // await sendEmail(email, subject, emailBody);

    return  res.status(201).send({status: true ,userId: isUserExist._id, msg: "OTP sent to your email." });    
  } catch (error) {
    return res
      .status(500)
      .json({
        status: false,
        msg: "Something went wrong.",
        error: error.message,
      });
  }
}

// ** reset password after verify otp **
export async function resetPassword(req, res) {
  try {
    const { id, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send({status: false, msg: "Password does not match" });
    }

    const isUserExist = await UserModel.findById(id);
    if (!isUserExist) {
      return res.status(404).send({status: false, msg: "Unauthorized access attempt" });
    }

    // Update the user's password
    (isUserExist.password = await bcrypt.hash(password, 10)); // Directly update the user's password
    isUserExist.decryptPassword = password;
    await isUserExist.save(); // Save the updated user

    return res.status(200).send({status: true, msg: "Password updated successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error); // Log the error for debugging
    return res.status(500).json({status: false, msg: "Internal server error" });
  }
}

// ** create session during password reset **
export async function passwordResetSession (req, res, next) {
  if (req.session.resetPassword) {
    return res.status(200).send({ flag: req.session.resetPassword });
  } else {
    res.status(403).send("Access Denied. Please verify your OTP first.");
  }
}

// ** Reset password session validatation **
export async function passwordValidateSession (req, res) {
  const { sessionId } = req.query;
  if (sessionStore[sessionId]?.isValid) {
    res.status(200).json({ isValid: true });
  } else {
    res.status(401).json({ isValid: false });
  }
}

// ** Reset password session logout **
export async function passwordLogoutSession (req, res) {
  const { sessionId } = req.body;
  if (sessionStore[sessionId]) {
    delete sessionStore[sessionId]; // Remove the session
    return res.status(200).json({ message: "Session invalidated" });
  }
  res.status(400).json({ message: "Session not found" });
}

// ** Add and update addresses **
export async function manageAddress(req, res) {
  try {
    const { values, mode } = req.body;
    const { userId } = req.user;

    // Check if the user exists
    const isUserExist = await UserModel.findById(userId);
    if (!isUserExist) {
      return res.status(401).json({ error: "Unauthorized access attempt" });
    }

    if (mode === "create") {
      let userAddressData = await AddressModel.findOne({ userId });

      // Generate a new UUID if values.id is an empty string
      if (!values.id) {
        values.id = uuidv4();
      }

      if (userAddressData) {
        // If the user already has addresses, add the new address
        userAddressData.addresses.push(values);

        // If no default address exists, set the new one as default
        if (!userAddressData.defaultAddress) {
          userAddressData.defaultAddress = values;
        }

        await userAddressData.save();
        return res.status(201).json({
          status: true,
          address: values,
          msg: "Address added successfully",
        });
      } else {
        // If no entry exists for this user, create a new one
        const newAddressEntry = new AddressModel({
          userId,
          defaultAddress: values,
          addresses: [values],
        });

        await newAddressEntry.save();
        return res.status(201).json({
          status: true,
          address: values,
          msg: "Address added successfully",
        });
      }
    }

    if (mode === "update") {
      // Find the existing address by userId and address ID
      const userAddressData = await AddressModel.findOne({ userId });

      if (!userAddressData) {
        return res.status(404).json({ error: "Address not found" });
      }

      const addressIndex = userAddressData.addresses.findIndex(
        (addr) => addr.id === values.id
      );
      

      if (addressIndex === -1) {
        return res.status(404).json({ error: "Address not found" });
      }

      // Update the specific address
      userAddressData.addresses[addressIndex] = {
        ...userAddressData.addresses[addressIndex],
        ...values,
      };

      // If defaultAddress is being updated, update it
      if (userAddressData.defaultAddress.id === values.id) {
        userAddressData.defaultAddress =
          userAddressData.addresses[addressIndex];
      }

      await userAddressData.save();

      return res.status(200).json({
        status: true,
        address: userAddressData.addresses[addressIndex],
        msg: "Address updated successfully",
      });
    }

    return res.status(400).json({ error: "Invalid mode" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ** get current user saved addresses **
export async function getUserAddresses(req, res) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: "User  not found" });
    }

    // Find addresses associated with the user
    const isAddressExist = await AddressModel.findOne({ userId: user._id });

    // Return the addresses array
    res.status(200).json({ addressList: isAddressExist });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// ** Delete an address by ID **
export async function deleteAddressById(req, res) {
  try {
    const user = req.user; // Authenticated user
    const { id } = req.params; // Address ID to delete

    if (!user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    // Find the user's address document in a single call
    const userAddresses = await AddressModel.findOne({ userId: user._id });
    if (!userAddresses) {
      return res.status(404).json({ error: "Address document not found" });
    }

    // Check if the address to delete exists in the addresses array
    const addressIndex = userAddresses.addresses.findIndex(
      (address) => address.id === id
    );

    if (addressIndex === -1) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Check if the address to delete is the default address
    const isDefaultAddress = userAddresses.defaultAddress?.id === id;

    // Remove the address from the addresses array
    userAddresses.addresses.splice(addressIndex, 1);

    // Update default address if the deleted address was the default
    if (isDefaultAddress) {
      if (userAddresses.addresses.length > 0) {
        userAddresses.defaultAddress = userAddresses.addresses[0];
      } else {
        userAddresses.defaultAddress = null;
      }
    }

    // Save the updated document
    await userAddresses.save();

    res.status(200).json({
      success: true,
      msg: "Address deleted successfully",
      defaultAddress: userAddresses.defaultAddress,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// ** Edit saved address **
export async function updateDefaultAddress(req, res) {
  try {
    const user = req.user; // Authenticated user
    const { id } = req.body; // Address ID to set as default
    
    const isAddressExist = await AddressModel.findOne({ userId: user._id });
    if(!isAddressExist) {
      return res.status(404).json({ status: false, msg: "Address not found" });
    }
    // find the address with the specified id in the Array
    const addressIndex = isAddressExist.addresses.findIndex(
      (address) => address.id === id
    )
    if(addressIndex === -1) {
      return res.status(404).json({ status: false, msg: "Address not found" });
    }
    // now set this array as default address
    isAddressExist.defaultAddress = isAddressExist.addresses[addressIndex];
    // save the updated document
    await isAddressExist.save();
    return res.status(200).json({ status: true, msg: "Default address updated successfully" });
  } catch (error) {
    console.error("Error updating default address:", error);
    res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

// ** Add PAN card details **
export async function pancardvalidation(req, res) {
  try {
    const user = req.user; // Assuming `req.user` contains authenticated user info
    const { values } = req.body;    

    // Encrypt PAN number and PAN image
    const encryptedPanNumber = encryptionText(values.panNumber);
    const encryptedPanImage = encryptionText(values.panImage);

    // Check for existing PAN card or PAN number
    const existingPanRecord = await PancardModel.findOne({
      $or: [{ userId: user.id }, { "panNumber.number": encryptedPanNumber.encrypt }],
    });

    if (existingPanRecord) {
      if (existingPanRecord.userId.toString() === user.id) {
        return res
          .status(400)
          .json({status: false, msg: "User has already saved a PAN card." });
      }

      if (existingPanRecord.panNumber.number === encryptedPanNumber) {
        return res
          .status(400)
          .json({ status: false, msg: "This PAN number is already registered." });
      }
    }

    // Create a new PAN card entry
    const newPancard = new PancardModel({
      userId: user.id,
      fullname: values.fullname,
      panNumber: {
        number: encryptedPanNumber.encrypt,
        secret: {
          iv: encryptedPanNumber.secret.iv,
          key: encryptedPanNumber.secret.key,
        },
      },
      panImage: {
        image: encryptedPanImage.encrypt,
        secret: {
          iv: encryptedPanImage.secret.iv,
          key: encryptedPanImage.secret.key,
        },
      },
      declaration: values.declaration,
    });

    // Save to database
    await newPancard.save();

    return res.status(201).json({
      msg: "PAN card saved successfully.",
      pancard: newPancard,
    });
  } catch (error) {
    console.error("Error adding PAN card information:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ** Get current user Pan Details **
export async function getPancardDetails(req, res) {
  try {
    const user = req.user;
    const isPanExist = await PancardModel.findOne({ userId: user.id });

    if (!isPanExist) {
      return res.status(404).json({ status: false, msg: "PAN card details not found." });
    }
    
    // Decrypt sensitive data
    const data = {
      userId: isPanExist.userId,
      fullname: isPanExist.fullname,
      panImage: decryptionText(isPanExist.panImage.image, isPanExist.panImage.secret.key),
      panNumber: decryptionText(isPanExist.panNumber.number, isPanExist.panNumber.secret.key),
      declaration: isPanExist.declaration,
    };

    return res.status(200).json({ success: true, msg: "pan details found!", data: data });
  } catch (error) {
    console.error("Error fetching PAN card details:", error);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

// ** Add items in wishlist **
export async function addItemWishlists(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    // Check if the wishlist exists for the user
    const isWishlistExists = await wishlistsModel.findOne({ userId: user.id });
    if (isWishlistExists) {
      const isProductExists = isWishlistExists.items.some(
        (item) => item.productId.toString() === id
      );

      if (isProductExists) {
        return res
          .status(400)
          .json({status: false, msg: "Product already exists in the wishlist" });
      } else {
        // Add the productId to the items array with optional notes
        isWishlistExists.items.push({
          productId: id,
        });
        await isWishlistExists.save(); // Save the updated wishlist
        return res
          .status(200)
          .json({status: true ,msg: "Product added to wishlist successfully" });
      }
    } else {
      // If the wishlist doesn't exist, create a new one with the productId
      const newWishlist = new wishlistsModel({
        userId: user.id,
        items: [
          {
            productId: id,
          },
        ],
      });
      await newWishlist.save(); // Save the new wishlist
      return res
        .status(201)
        .json({status: true, msg: "Wishlist created and product added successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({status: false, msg: "Internal Server Error" });
  }
}

// ** Remove items from wishlist **
export async function removeItemWishlists(req, res) {
  try {
    const userId = req.user.id;
    const { id: productId } = req.params;

    // Check if the wishlist exists for the user and find the product index in one query
    const wishlist = await wishlistsModel.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        status: false,
        msg: "Wishlist not found for the user",
      });
    }

    // Find the index of the product in the items array
    const productIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        status: false,
        msg: "Product not found in the wishlist",
      });
    }

    // Remove the product from the items array and save the updated wishlist
    wishlist.items.splice(productIndex, 1);
    await wishlist.save();

    // Populate the entire product object and return updated items
    const updatedWishlist = await wishlistsModel
      .findOne({ userId })
      .populate("items.productId")
      .exec();

    const items = updatedWishlist.items.map((item) => item.productId);

    return res.status(200).json({
      status: true,
      msg: "Product removed from wishlist successfully",
      updatedWishlist: items,
    });
  } catch (error) {
    console.error("Error removing item from wishlist:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ** Get current user wishlists **
export async function getWishlists(req, res) {
  try {
    const user = req.user;
    const { location } = req.query;
    
    if(location === "homepage") {
      const isWishlistExist = await wishlistsModel.findOne({ userId: user.id});
      if(!isWishlistExist) {
        return res.status(404).json({ error: "User's wishlist not found" });
      }
      const items = isWishlistExist.items.map((item) => item.productId);
      return res.status(200).json({wishlist: items});
    } else {
      const isWishlistExist = await wishlistsModel
        .findOne({ userId: user.id })
        .populate("items.productId") // Populate the entire product object
        .exec();
      if (!isWishlistExist) {
        return res.status(404).json({ error: "User's wishlist not found" });
      }
      const items = isWishlistExist.items.map((item) => item.productId);

      return res.status(200).json({ wishlist: items });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// ** Add DUMMY PRODUCTS in the DB [ADMIN USE ONLY] **
export async function products(req, res) {
  try {
    const productsData = req.body; // Assuming products are sent in the body of the request
    const savedProducts = await ProductModel.insertMany(productsData.body);
    res.status(201).json(savedProducts);
  } catch (error) {
    console.error("Error saving products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ** Get all products **
export async function getProducts(req, res) {
  try {
    // Fetch all products from the database
    const products = await ProductModel.find();

    // If there are no products found
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Send the products as a response
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ** Get product details by ID **
export async function getProductsById(req, res) {
  try {
    const {id} = req.query;
    
    const isProductExist = await ProductModel.findById(id);
    if(!isProductExist) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({status: true, msg: "Product Found", item: isProductExist});
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ** Get products by User search request **
export async function getSearchProducts(req, res) {
  try {
    const { query } = req.query; // Extract the search query from the request

    // Search for products that match the search query
    const searchResults = await ProductModel.find({
      $or: [
        { title: { $regex: query, $options: "i" } }, // Search by title (case-insensitive)
        { brand: { $regex: query, $options: "i" } }, // Search by brand (case-insensitive)
        { category: { $regex: query, $options: "i" } }, // Search by category (case-insensitive)
      ],
    });

    res.status(200).json({status: true, msg: "Search results found", data: searchResults}); // Send the search results as JSON response
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Get current user Cart Details **
export async function getItemsInCart(req, res) {
  try {
    const user = req.user;
    const isCartExist = await ShoppingBagModel.findOne({ userId: user._id }).populate('items.productId');

    if(!isCartExist) {
      return res.status(404).json({ status: false, msg: "Cart not found." });
    }

    return res.json({ status: true, msg: "Cart items fetched successfully.", cart: isCartExist });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Add items in Cart **
export async function addItemsToCart(req, res) {
  try {
    const user = req.user; // Assuming the user is authenticated and attached to the request
    const { product } = req.body; // Expecting a product object in the request body
    
    if (!product || !product.productId || !product.price || !product.quantity) {
      return res
        .status(400)
        .json({
          status: false,
          msg:
            "Incomplete product data. Ensure product ID, price, and quantity are provided.",
        });
    }

    // Check if the user's cart already exists
    let isCartExist = await ShoppingBagModel.findOne({ userId: user._id });

    if (!isCartExist) {
      // If no cart exists, create a new one
      isCartExist = new ShoppingBagModel({
        userId: user._id,
        items: [],
        totalPrice: 0,
      });
    }

    // Check if the product already exists in the cart
    const existingItem = isCartExist.items.find(
      (item) => item.productId.toString() === product.productId
    );

    if (existingItem) {
      // If the product exists, update the quantity
      existingItem.quantity += product.quantity;
    } else {
      // If the product does not exist, add it to the cart
      isCartExist.items.push({
        productId: product.productId,
        name: product.title || "Unnamed Product", // Use product name if available
        price: product.price,
        quantity: product.quantity,
        discount: {}, // Add discount if provided
      });
    }

    // Recalculate the total price
    isCartExist.totalPrice = isCartExist.items.reduce((total, item) => {
      const discountValue = item.discount?.value || 0;
      return total + item.price * item.quantity - discountValue;
    }, 0);

    // Save the updated cart to the database
    await isCartExist.save();

    res.status(200)
      .json({ status: true, cart: isCartExist, msg: "Product added to the cart successfully." });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Remove items from Cart **
export async function removeItemsFromCart(req, res) {
  try {
    const user = req.user;
    const { product } = req.body;

    if (!product || !product._id) {
      return res
        .status(400)
        .json({
          status: false,
          msg: "Product object or ID is missing in the request body.",
        });
    }

    // Check if the user's cart exists
    const isCartExist = await ShoppingBagModel.findOne({ userId: user._id });
    if (!isCartExist) {
      return res.status(404).json({ status: false, msg: "User's cart not found." });
    }

    // Find the index of the product to remove
    const itemIndex = isCartExist.items.findIndex(
      (item) => item.productId.toString() === product.productId._id.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ status: false, msg: "Product not found in the cart." });
    }

    // Remove the product from the items array
    isCartExist.items.splice(itemIndex, 1);

    // Recalculate the total price after removing the item
    isCartExist.totalPrice = isCartExist.items.reduce((total, item) => {
      const discountValue = item.discount?.value || 0;
      return total + item.price * item.quantity - discountValue;
    }, 0);

    // Save the updated cart to the database
    await isCartExist.save();

    res
      .status(200)
      .json({ status: true, cart: isCartExist, msg: "Product removed from the cart successfully." });
  } catch (error) {
    console.error("Error removing items from cart:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Edit items in Cart [color, size, quantity, ...] **
export async function updateItemsInCart(req, res) {
  try {
    const user = req.user;
    const { id, quantity } = req.body;

    const isCartExist = await ShoppingBagModel.findOne({ userId: user._id});
    if(!isCartExist) {
      return res.status(404).json({ status: false, msg: "Cart not found." });
    }

    // Update the quantity of the items in the cart
    const itemIndex = isCartExist.items.findIndex(
      (item) => item.productId.toString() === id
    )
    if (itemIndex === -1) {
      return res.status(404).json({ status: false, msg: "Product not found in the cart." });
    }
    isCartExist.items[itemIndex].quantity += quantity;
    isCartExist.totalPrice = isCartExist.items.reduce((total, item) => {
      const discountValue = item.discount?.value || 0;
      return total + item.price * item.quantity - discountValue;
    }, 0);
    await isCartExist.save();

    return res.status(200).json({ status: true, cart: isCartExist, msg: "Cart updated successfully." });
  } catch (error) {
    console.error("Error updating items in cart:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Coupons add in DB [ADMIN use Only] **
export async function couponsAddInDB(req, res) {
  try {
    const coupons = ["AGRQO5NPPZ", "DISCOUNT10", "SAVE20"];
    const cp = await CouponModel.insertMany(coupons.map((coupon) => ({ code: coupon })));

    return res.status(201).json({ status: true, msg: "Coupons added successfully." });
  } catch (error) {
    console.error("Error adding coupons:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Get all coupons **
export async function getCoupons(req, res) {
  try {
    const user = req.user;
    if(user) {
      const coupons = await CouponModel.find({});
      return res.status(200).json({ status: true, coupons });
    }
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Add product review by current User **
export async function addReviewProduct(req, res) {
  try {
    const user = req.user;
    const { values } = req.body;
    if(user) {

    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}

// ** Get All Reviews of a Product by its ID **
export async function getProductReviewsById(req, res) {
  try {
    const id = req.params.id;

    const isReviewExist = await ReviewModel.findOne({productId: id});
    if(!isReviewExist) {
      return res.status(404).json({ status: false, msg: "No review found for this product." });
    }

    return res.status(200).json({ status: true, reviews: isReviewExist });
  } catch (error) {
    console.error("Error fetching product review:", error);
    res.status(500).json({ status: false, msg: "Internal server error." });
  }
}


