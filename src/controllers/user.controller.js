import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser  = asyncHandler(async (req, res) => {
    // get user detail from frontend
    // validation - not empty
    // check if user already exist: username or email
    // check for image , check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    //
    const { username, email, password, fullName} = req.body;
    console.log("email", email);

    //
    if([fullName, username, email, password].some((field) => field?.trim() === "")){
    throw new ApiError(400, "All fields are required");
    }
    //
    const existUser = User.findOne({
        $or: [{ username }, { email }],
    })
    if(existUser){
        throw new ApiError(409, "User with username, email already exists");
    }
   //
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong wile registering the user");
    }

    //
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User register successfully")
    )
})

export {registerUser}
