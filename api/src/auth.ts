import axios from "axios";
import jwt from "jsonwebtoken";
export const callbackHandler = async (req, res) => {
  const { code } = req.query;

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }
  );

  const accessToken = response.data.substring(
    response.data.indexOf("=") + 1,
    response.data.indexOf("&")
  );

  const profileResponse = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Encoding": "text/html; charset=UTF-8",
    },
  });

  console.log(profileResponse.data)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const token = jwt.sign(
    {
      id: profileResponse.data.login,
      username: profileResponse.data.login,
      expires,
    },
    process.env.JWT_SECRET as string,
    { algorithm: "HS256" }
  );

  res.cookie("auth_token", token);
  res.send({
    token: token,
  });
};
