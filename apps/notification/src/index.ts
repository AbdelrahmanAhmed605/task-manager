import express from "express";
import dotenv from "dotenv";
import routes from './routes'

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

const port = process.env.PORT || 3333;
app.listen(port, () => console.log("Now listening"));
