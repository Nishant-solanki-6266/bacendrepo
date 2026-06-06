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
    // console.log("userrrr", user);

    // save kr diya database me,yha save hua
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
  // form ,json se data hmesa req,body me hadle kiya jata hai , url ko alg se handle krte hai
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
  // multer se avatar lenaa
  const avatarLocalPath = req.files?.avatar[0]?.path
  // jb coverImage na bhje const coverImagePath=req.files?.coverImage[0]?.path;

  // classic tarike se coverImage ydi na send kre to
  let coverImagePath
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    coverImagePath = req.files.coverImage[0].path
  } // ye line mtlb req.files hai and array me hai and length 0 se bdi ho

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
  // full prrof user create hua hai or usi user ke password ko remove bhi kr do

  const createUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  if (!createUser) {
    throw new ApiError(500, 'something went wrong while registering the user')
  }

  // return responce
  //  console.log("coverImage",coverImage);

  return res
    .status(201)
    .json(new ApiResponce(200, createUser, ' User registerd successfully'))
})

//  login
const loginUser = asyncHandler(async (req, res) => {
  // data liya -> req.body se
  const { username, email, password } = req.body

  // validation :- username or email na hoto
  if (!(username || email)) {
    throw new ApiError(400, 'Username or Password Required')
  }

  // or hmne user nikal liya // username or email ke base pr
  const user = await User.findOne({
    $or: [{ username }, { email }] // pura object dega yaha se
  })

  //  console.log("user",user);

  if (!user) {
    throw new ApiError(404, 'User Does Not Exist')
  }
  //  console.log("yha check kr ki user me pura data aaya refresh ko chordkar",user);

  // ab Password check kr liya hmne .
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid User Creditials')
  }

  // generate AccessToken or RefreshToken wali methord ko coll kiya.
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  //  yha hum jo 110 line me user nikala tha uske pas beta refreshToken nhi hoga kyuki generate methord to 125 line me hai to vha se database me refreshToken  save hoga. to  aage ak bar or database Query markar loggeduser  le lege. or usme refresh or password hide kr dege

  const LoggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  // send cookie

  const options = {
    httpOnly: true,
    secure: true
  }
  //  return responce, kbhi kbhi modile app me cookie send nhi kr pate isliye apiResponce me bhi rereshToken or accesstoken send kr diya hai

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
    ) // res me bhej diya hai
})
// logout
const logOutUser = asyncHandler(async (req, res) => {
  // console.log("controller",req.user._id);

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

// AccessToken Expiry ho jaye or RefrshToken Ke base par Nya AccessTokeen bnana hoto
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

    // check krege database me ye decodedToken se ID nikal  kr Pura USer nikal lege.
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, 'invalid RefreshToken')
    }

    //Ab Match kr lege jo req.cookie se nikala refrshToken or user._id me save kiya tha vo  same hai to aage bado
    if (inComingRefreshToken == user?.refreshToken) {
      //const user=await User;  is user me pura data hoga refreshtoken bhi hoga
      throw new ApiError(401, 'RefreshToken is Expired hai ya to used')
    }

    //config
    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    ) // yha newAccess newRef le liya is bar kyuki ak bar phle use kr chuke hai hum

    //  return responce
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

// ab Hum update wali cheeze bnayeg.
const updateCurrentPassword = asyncHandler(async (req, res) => {
  // postmen se le liya password;
  const { oldPassword, newPassowrd } = req.body

  // verifyJwt se user login wala milega;
  const user = await User.findById(req?.user._id)

  // ab jo hmare user mtlb database me ak methord hai password  correct wali se hum password confirm krba lege.

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Password is Incorrect')
  }

  // ab new passoword ko oldpassword se replace kr do.or save kr do.

  user.password = newPassowrd
  await user.save({ validateBeforeSave: false })

  // responce kr dege
  return res
    .status(200)
    .json(new ApiResponce(200, {}, 'Password is SuccessFully Update'))
})

//  currentUser nikal lege ki kon Login hai.
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponce(200, req.user, 'Current User  Fetched SuccessFully!'))
})
// Account ke andr ki details kon kon si update krna hai vo wala control.image vgera ke alg controller likhe jate hai.
const updateAccountDetails = asyncHandler(async (req, res) => {
  // body se value le li update wali.
  const { fullname, email } = req.body
  if (!fullname && !email) {
    throw new ApiError(400, 'FullName and Email is required for updation!')
  }
  // ab user nikal ke Update kr dege value or new True ka mtlb update krke return kr do value ko
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

// ab hum files mtlb avatar Update krege.

// Phle hum req.file se file lege dyan rkhan only file ka use krege files nhi
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req?.file.path
  if (!avatarLocalPath) {
    throw new ApiError(400, ' Avatar File is Missing ')
  }
  //cloudinary par uplod kr do.local path deke
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new ApiError(
      400,
      'Error while uploading on avatar ,update me avatar file nhi aayi cloudinary se'
    )
  }

  // ab req.user me hmare pas pura login wala user hai jo verifyjwt se return hoga kyuki vo middleware route me hai isliye yha bhi return hoga
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
//  33:20  tk dekh liya hai mene logout krega ab
