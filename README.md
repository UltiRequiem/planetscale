# PlanetScale

> https://planetscale.com

A simple client for connecting to PlanetScale

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

If you plan to use [dotenv](https://github.com/motdotla/dotenv), you could writ a `.env` file like:

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
import PlanetScale from "planetscale";
import dotenv from "dotenv";

import { env } from "node:process";

dotenv.config();

const { db, tokenName, org, token } = env;

const connection = new PlanetScale({ db, tokenName, org, token });

const [rows] = await connection.query("SELECT * FROM Persons");

console.log(rows);
```

Check [examples/](./examples) for more.

## Licence

Released under the MIT Licence.
