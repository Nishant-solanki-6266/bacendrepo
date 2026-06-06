import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponce } from '../utils/ApiResponce.js'
import jwt from 'jsonwebtoken'
// generate AceessAndRefreshToken
const generateAccessAndRefreshTokens = async userId => {
  try {
    const user = await User.findById(userId) // methord hmesa document pr lgti hai user,, but kbhi bhi database wali User model  me nhi lgata hai
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    // user me dal diya  then save bhi krvana hai,
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false }) // validatebefore isliye ki hr bar password nhi hoga

    //  or jo bhi  ye methord use krega return me accesstoken or refreshtoken bhej dega

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating Refresh and Access Token'
    )
  }
}
// register user:-----
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body
  console.log('username:-', email)

  //validation
  if (
    [fullname, email, username, password].some(fields => fields?.trim() === '')
  ) {
    throw new ApiError(400, 'All field are required')
  }
  // console.log(fullname,username,password,email);

  //    exitedUser
  const exitedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (exitedUser) {
    throw new ApiError(409, 'User with email or username already existed!')
  }
  const avatarLocalPath = req.files?.avatar[0]?.path

  let coverImagePath
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    coverImagePath = req.files.coverImage[0].path
  } 
  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar file is required')
  }
  //upload in  clodinary
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImagePath)

  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required')
  }
  // database me create kiya user
  const user = await User.create({
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    fullname,
    email,
    username: username.toLowerCase(),
    password
  })

  const createUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  if (!createUser) {
    throw new ApiError(500, 'something went wrong while registering the user')
  }


  return res
    .status(201)
    .json(new ApiResponce(200, createUser, ' User registerd successfully'))
})

//  login
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  if (!(username || email)) {
    throw new ApiError(400, 'Username or Password Required')
  }

  const user = await User.findOne({
    $or: [{ username }, { email }] // pura object dega yaha se
  })


  if (!user) {
    throw new ApiError(404, 'User Does Not Exist')
  }

  // ab Password check kr liya hmne .
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid User Creditials')
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )


  const LoggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  // send cookie

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponce(
        200,
        { user: LoggedInUser, accessToken, refreshToken },
        'User Logged in SuccessFully'
      )
    ) 
})
// logout
const logOutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,

    {
      // $set:{
      //   refreshToken:undefined    // bhai ye code se logout krte smy refrshToken Database se dilate nhi ho rha tha. to iska code thoda sa change hoga
      // }

      $unset: { refreshToken: 1 }
    },
    {
      new: true
    }
  )

  //cookie config
  const options = {
    httpOnly: true,
    secure: true
  }
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponce(200, {}, 'User loggedOut SuccessFully'))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!inComingRefreshToken) {
    throw new ApiError(401, 'unauthorized request')
  }
  try {
    // decoded
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    console.log('check kr kya kya aata hai', decodedToken)

    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, 'invalid RefreshToken')
    }

    if (inComingRefreshToken == user?.refreshToken) {
      throw new ApiError(401, 'RefreshToken is Expired hai ya to used')
    }

    //config
    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    ) 
    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponce(
          200,
          { accessToken, refreshToken },
          'AccessToken Refreshed'
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || 'invalid RefreshToken')
  }
})

const updateCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassowrd } = req.body

  // verifyJwt se user login wala milega;
  const user = await User.findById(req?.user._id)


  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Password is Incorrect')
  }


  user.password = newPassowrd
  await user.save({ validateBeforeSave: false })

  // responce kr dege
  return res
    .status(200)
    .json(new ApiResponce(200, {}, 'Password is SuccessFully Update'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponce(200, req.user, 'Current User  Fetched SuccessFully!'))
})
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body
  if (!fullname && !email) {
    throw new ApiError(400, 'FullName and Email is required for updation!')
  }
  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: { fullname, email }
    },
    { new: true }
  ).select('-password')

  return res
    .status(200)
    .json(
      new ApiResponce(200, user, 'User Account Details updated SuccessFully')
    )
})


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req?.file.path
  if (!avatarLocalPath) {
    throw new ApiError(400, ' Avatar File is Missing ')
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new ApiError(
      400,
      'Error while uploading on avatar ,update me avatar file nhi aayi cloudinary se'
    )
  }

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: { avatar: avatar.url }
    },
    { new: true }
  ).select('-password')

  return res
    .status(200)
    .json(new ApiResponce(200), user, 'updated avatar SuccessFully')
})
// update CoverImage
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req?.file.path
  if (!coverImagePath) {
    throw new ApiError(400, 'CoverImage is Missing')
  }
  const coverImage = uploadOnCloudinary(coverImagePath)

  if (!coverImage.url) {
    throw new ApiError(400, 'Error while uploading on coverImage')
  }
  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: { coverImage: coverImage.url }
    },
    { new: true }
  ).select('-password')

  return res
    .status(200)
    .json(new ApiResponce(200), user, 'updated CoverImage SuccessFully')
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}

