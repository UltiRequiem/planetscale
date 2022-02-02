# PlanetScale

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
