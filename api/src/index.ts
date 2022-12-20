import express from "express";
import { initializeIDE, isIDERunning } from "./ide";
import { callbackHandler, createSessionToken } from "./auth";
const dotenv = require("dotenv");
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from 'cors'

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors())

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/auth/github", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user`
  );
});
app.get("/auth/callback", (req, res) => callbackHandler(req, res));

app.get("/auth/whoami", async (req, res) => {
  let token = req.cookies.auth_token;

  if (!token) {
    return res.status(404).send("unauthorized")
  }

  token = jwt.verify(token, process.env.JWT_SECRET as string);

  if (!token) {
    return res.status(404).send("unauthorized")
  }

  return res.status(200).send(token);
})

app.get("/ide/create", async (req, res) => {
  let token = req.cookies.auth_token;
  token = jwt.verify(token, process.env.JWT_SECRET as string);

  const ideResponse = await initializeIDE(token.id);

  if (ideResponse.status === "created") {
    if (ideResponse.clusterIP) {
      res.cookie(
        "session_token",
        createSessionToken(ideResponse.clusterIP, token.id),
        {
          httpOnly: true,
          domain: ".codelaunch.sh",
        }
      );
    }
  }

  res.status(200).send(ideResponse.status);
});

app.get("/ide/status", async (req, res) => {
  let token = req.cookies.auth_token;
  token = jwt.verify(token, process.env.JWT_SECRET as string);

  if (!token) {
    return res.status(404).send("Unauthorized")
  }

  const isRunning = await isIDERunning(token.id);

  return res.status(200).send(isRunning);
});

app.listen(8000, () => {
  console.log("listening at port 8000");
});
