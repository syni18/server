import ms from 'ms';  // parsing time string

const setTokenCookies = (
  res,
  accessToken,
  refreshToken,
  accessTokenExpiry,
  refreshTokenExpiry
) => {

  // Convert the tokens string to milliseconds
  const accessTokenMaxAge = ms(accessTokenExpiry); // ms will handle strings like '100s', '2d', '1h', etc.
  const refreshTokenMaxAge = ms(refreshTokenExpiry);

  //set cookie
  res.cookie("accessToken", accessToken, {
    maxAge: accessTokenMaxAge,
    httpOnly: true,
    secure: true,
    //   sameSite: 'strict',
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: refreshTokenMaxAge,
    httpOnly: true,
    secure: true,
    //   sameSite: 'strict',
  });
};

export default setTokenCookies;