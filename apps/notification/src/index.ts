import express from "express";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/notifications", routes);

app.use((req, res, next) => {
  res.status(404).send("<h1>Wrong Route!</h1>");
});

const port = process.env.PORT || 3333;
app.listen(port, () => console.log("Now listening"));
