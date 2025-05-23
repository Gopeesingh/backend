import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser  = asyncHandler(async (req, res) => {
    //1:- get user detail from frontend
    //2:-  validation - not empty
    //3:-  check if user already exist: username or email
    //4:-  check for image , check for avatar
    //5:-  upload them to cloudinary, avatar
    //6:-  create user object - create entry in db
    //7:-  remove password and refresh token field from response
    //8:-  check for user creation
    //9:-  return res

    //1 get user detail from frontend
    const { username, email, password, fullName} = req.body;
    console.log("email", email);

    //2:-  validation - not empty
    if([fullName, username, email, password].some((field) => field?.trim() === "")){
    throw new ApiError(400, "All fields are required");
    }
    //3:-  check if user already exist: username or email
    const existUser = await User.findOne({
        $or: [{ username }, { email }],
    })
    if(existUser){
        throw new ApiError(409, "User with username, email already exists");
    }
   //4:-  check for image , check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //5:- upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //6:- create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    //7:- remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong wile registering the user");
    }

    //9:-  return res
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User register successfully")
    )
})

// generate access token and refresh token
const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const loginUser = asyncHandler(async (req, res) => {
// req body -> data
// username or email
// find the User
// check for password
// generate access token and refresh token
// send cookies

// req body -> data
const {email, username, password} = req.body
console.log(email);

// username or email
if(!username && !email){
    throw new ApiError(400, "Email or username is required")
}

// find the User
 const user = await User.findOne({
        $or: [{username}, {email}]
    })
console.log("user", user);
if(!user){
    throw new ApiError(404, "User does not exist")
}

// check for password
const isPasswordValid  = await user.isPasswordCorrect(password);

if(!isPasswordValid ){
    throw new ApiError(401, "Invalid password")
}

// generate access token and refresh token
const{ accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

// send cookies
const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"  // remove password and refresh token by select from user
)

const options = {httpOnly: true, secure: true} // not visible in frontend

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(200,
        {user: loggedInUser, refreshToken, accessToken},
        "User logged in successfully")
)
})

const logoutUser = asyncHandler(async (req, res) => {
await User.findByIdAndUpdate(req.user._id, {
    $set: {
        refreshToken: undefined
    }
},{
    new: true
})

const options = {httpOnly: true, secure: true} // not visible in frontend

return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const option = {httpOnly: true, secure: true} // not visible in frontend

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(200, {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassWord = asyncHandler(async (req, res) => {
    const { oldPassword, newPassWord} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassWord
    await user.save({ validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, " current User fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "Full name and email are required")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account detail updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    // TODO: delete previous avatar from cloudinary
    const DeleteAvatar = await User.findById(req.user?._id);
    if(DeleteAvatar?.avatar){
        await deleteFromCloudinary(DeleteAvatar.avatar);
    }
    // upload new avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }
    // update user avatar
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

const channel = await User.aggregate([
    {
        $match: { // first we match the user or filter the user
            username : username?.toLowerCase()
        }
    },
    {
        $lookup: { // kitane subscriber hai channel ke through
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup: { // hamne kitane ko subscribe kar rakha hai subscriber through
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscriberCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false,
                }
            }
        }
    },
    {
        $project: {
            fullName: 1,
            username: 1,
            subscriberCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
    }
    
    
])

if(!channel?.length){
    throw new ApiError(404, "Channel does not exist")
}

return res
.status(200)
.json (
    new ApiResponse(200, channel[0], "Channel profile fetched successfully")
)

})

const getWatchHistory = asyncHandler(async (req, res) => {
const user = await User.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                    owner:{
                        $first: "$owner"
                    }
                    }
                }
            ]
        }
    }
])
return res
.status(200)
.json(
    new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
    )
)
})

export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassWord,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory,

}
