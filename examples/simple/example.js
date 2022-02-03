import connect from "planetscale";
import { env } from "node:process";
import "dotenv/config";

const { db, tokenName, org, token } = env;

const connection = await connect({ db, tokenName, org, token });

const [rows] = await connection.promise().query("SELECT * FROM Persons");

console.log(rows)

connection.end();
