import PlanetScale from "../../dist/index.js";
import dotenv from "dotenv";

import { env } from "node:process";

dotenv.config();

const { db, tokenName, org, token } = env;

const connection = new PlanetScale({ db, tokenName, org, token });

const [rows] = await connection.query("SELECT * FROM Persons");

console.log(rows);
