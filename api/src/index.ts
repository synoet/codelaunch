import express from "express";
import {initializeIDE} from "./ide";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/pod/create/:id", async (req, res) => {
  await initializeIDE(req.params.id);
  res.status(200).send("OK");
});

app.listen(8000, () => {
  console.log("listening at port 8000");
});
