import jwt, { JwtPayload } from "jsonwebtoken";

export const decodeToken = (token: string): JwtPayload | null => {
  let data: JwtPayload | null = null;
  try {
    data = jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (e) {
    console.log(`Failed to verify jwt: ${e}`);
  }

  return data || null;
};
