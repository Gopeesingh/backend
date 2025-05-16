import {Router} from 'express';
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassWord, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js';
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

router.route("/register").post(
    upload.fields([ // middleware
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
    );

router.route("/login").post(loginUser);

//secured route
router.route("/logout").post(verifyJWT, logoutUser); // verifyJWT means the user is logged in hai n tabhi logOut hoga and it is middlewares to check 
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassWord);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user").patch(verifyJWT, updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar); // single means only one file will be uploaded and avatar is the name of the file in the form data
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); // single means only one file will be uploaded and coverImage is the name of the file in the form data
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;