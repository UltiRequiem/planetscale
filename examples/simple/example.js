import PlanetScale from "planetscale";
import { env } from "node:process";
import "dotenv/config";

const { db, tokenName, org, token } = env;

const connection = new PlanetScale({ db, tokenName, org, token });

const [rows] = await connection.query("SELECT * FROM Persons");

console.log(rows);
