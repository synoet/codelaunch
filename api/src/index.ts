import express from "express";
import { initializeIDE } from "./ide";
import { callbackHandler } from "./auth";
const dotenv = require("dotenv");
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.get("/ide/create/", async (req, res) => {
  let token = req.cookies.minikube_token;
  token = jwt.verify(token, process.env.JWT_SECRET as string);
  console.log(token)

  await initializeIDE(token.id);
  res.status(200).send("IDE initialized");
});

app.get("/ide", async (req, res) => {
  let token = req.cookies.minikube_token;
  token = jwt.verify(token, process.env.JWT_SECRET as string);
})

app.listen(8000, () => {
  console.log("listening at port 8000");
});
