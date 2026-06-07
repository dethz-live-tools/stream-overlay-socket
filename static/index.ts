import express from "express";
import "dotenv/config";
import ezServe from "ez-serve";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use("/", express.static("public"));

ezServe(app, port);
