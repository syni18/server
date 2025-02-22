import { Router } from "express";
import passport from "passport";

const router = Router();

// ** import all controller **
import * as controller from '../controllers/appController.js';
import { localVariables } from "../middleware/auth.js";
import { registerMail } from "../controllers/mailer.js";
import accessTokenAutoRefresh from "../middleware/accessTokenAutoRefresh.js";

// Post method
router.route('/register').post(
    controller.register);  // register user
router.route('/registerMail').post(
    registerMail);  // send the email
router.route("/login").post(
    controller.login);  // login in app
router.route('/refreshtoken').post(
    controller.getNewAccessToken); //)
router.route("/authenticate").post(
    controller.verifyUser,(req,res)=> res.end());  // authenticate the user
router.route("/logout").post(
    accessTokenAutoRefresh, controller.logout);  // login in app
router.route('/recovery').post(
    controller.recovery); // recovery in app
router.route("/verify-Otp").post(
    controller.verifyOTP);  // verify the generated OTP
router.route("/manageAddress").post(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', { session: false }),
    controller.manageAddress);  //add address in db
router.route("/pancardvalidation").post(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.pancardvalidation);  //add pan card in db
router.route("/products").post(
    controller.products);  //insert products
router.route("/addItemWistlists/:id").post(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.addItemWishlists);  //add product to watchlist
router.route("/addProductToCart").post(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.addItemsToCart);  //add product to cart
router.route("/validate-session").get(
    controller.passwordValidateSession);
router.route("/logout-session").post(
    controller.passwordLogoutSession);
router.route("/couponsAddInDB").post(
    controller.couponsAddInDB);


// Get method
router.route("/auth/google").get(
    controller.getAuthGoogle);
router.route("/auth/google/callback").get(
    controller.getCallbackGoogle);
router.route("/users").get(
    accessTokenAutoRefresh, (req, res, next) => {
      passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (err) {
          return res.status(500).json({ error: "Authentication error" });
        }
        if (!user) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.user = user;
        return controller.getUser(req, res, next);
      })(req, res, next);
    });
router.route('/user/email/:email').get(
    controller.getUserByEmail);  // user with userEmail
router.route("/generate-Otp").get(
    localVariables, controller.generateOTP);  // generate random unique OTP
router.route("/check-session").get(
    controller.passwordResetSession);
router.route("/addresses").get(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.getUserAddresses);  // address list
router.route("/getWishlists").get(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.getWishlists);  //saved watchlist
router.route("/getProducts").get(
    controller.getProducts)  // get all products
router.route("/getItemsInCart").get(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.getItemsInCart);
router.route("/getProductsById").get(
    controller.getProductsById);  //get product by id
router.route("/getProducts/search").get(
    controller.getSearchProducts); //get th e search result
router.route("/getPancardDetails").get(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.getPancardDetails); //
router.route("/getCoupons").get(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.getCoupons);  //get all coupons
router.route("/getProductReviews/:id").get(
    controller.getProductReviewsById);

// Put method
router.route("/updateUserProfile").put(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.updateUserProfile);  // is use to update the user profile
router.route("/resetPassword").put(
    controller.resetPassword);  // use to reset password
router.route("/updateItemsInCart").put(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.updateItemsInCart);  //update the cart
router.route("/setDefualtAddress").put(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.updateDefaultAddress);  //set the default address
router.route("/reviewProduct").put(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.addReviewProduct); //update the product


// Delete Method
router.route("/address/:id").delete(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.deleteAddressById);  //delete the saved address list item
router.route("/removeItemWishlists/:id").delete(
    accessTokenAutoRefresh,
    passport.authenticate('jwt', {session: false}),
    controller.removeItemWishlists);  //remove product to watchlist
router.route("/removeProductFromCart").delete(
    accessTokenAutoRefresh,
    passport.authenticate("jwt", { session: false }),
    controller.removeItemsFromCart);  //remove product from cart



export default router;