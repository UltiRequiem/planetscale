# PlanetScale

A simple client for connecting to [PlanetScale](https://planetscale.com).

## Setup

You need to have installed [pscale](https://github.com/planetscale/cli).

```sh
$ pscale service-token create
  NAME           TOKEN
 -------------- ------------------------------------------
  tokenName     token

$ pscale service-token add-access tokenName connect_production_branch --database test
  DATABASE   ACCESSES
 ---------- ---------------------------
  test       connect_production_branch
```

If you plan to use [dotenv](https://github.com/motdotla/dotenv), you could write
a `.env` file like:

```sh
db=
tokenName=
org=
token=
```

## Install

```sh
npm install planetscale # yarn add planetscale
```

## Usage

```js
import connect from "planetscale";
import { env } from "node:process";
import "dotenv/config";

const { db, tokenName, org, token } = env;

const connection = await connect({ db, tokenName, org, token });

const [rows] = await connection.promise().query("SELECT * FROM Persons");

console.log(rows);

connection.end();
```

The default export, `connect`, returns a `Connection`, it is basically a wrapper
around `mysql2.createConnection`.

Check the [docs](https://github.com/mysqljs/mysql) to know all the API.

Check [examples/](./examples) for more.

## Licence

Released under the MIT Licence.
