import { Buffer } from "node:buffer";
import { request } from "node:https";
import { webcrypto } from "node:crypto";

import { customAlphabet } from "nanoid";
import {
  cryptoProvider,
  Pkcs10CertificateRequestGenerator,
} from "@peculiar/x509";
import { createConnection } from "mysql2";

import type { IncomingMessage } from "node:http";
import type { Connection, ConnectionOptions } from "mysql2";

interface WebCrypto {
  readonly subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
}

interface CertData {
  id: string;
  certificate: string;
  database_branch: { access_host_url: string };
}

const crypto = webcrypto as unknown as WebCrypto;

cryptoProvider.set(crypto);

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

const nodeBtoa = (str: string) => Buffer.from(str, "binary").toString("base64");

const base64encode = typeof btoa !== "undefined" ? btoa : nodeBtoa;

interface PlanetScaleConfig {
  readonly branch: string;
  readonly tokenName: string;
  readonly token: string;
  readonly org: string;
  readonly db: string;
}

export class PlanetScale {
  readonly branch?: string;
  readonly tokenName: string;
  readonly token: string;
  readonly org: string;
  readonly db: string;
  readonly connectionOptions?: ConnectionOptions;
  #baseURL: string;
  #headers: { Authorization: string };
  #connection: Connection | null = null;

  constructor(
    { branch = "main", tokenName, token, org, db }: PlanetScaleConfig,
    connectionOptions = {}
  ) {
    this.branch = branch;
    this.tokenName = tokenName;
    this.token = token;
    this.org = org;
    this.db = db;
    this.#baseURL = "https://api.planetscale.com";
    this.#headers = { Authorization: `${tokenName}:${token}` };
    this.connectionOptions = connectionOptions;
  }

  async getConnection(): Promise<Connection> {
    if (!this.#connection) {
      this.#connection = await this.#createConnection();
    }

    return this.#connection;
  }

  async #createConnection() {
    const alg = {
      name: "ECDSA",
      namedCurve: "P-256",
      hash: "SHA-256",
    };

    const keyPair = await crypto.subtle.generateKey(alg, true, [
      "sign",
      "verify",
    ]);

    if (!keyPair.privateKey) {
      throw new Error("Failed to generate keypair");
    }

    const csr = await Pkcs10CertificateRequestGenerator.create({
      keys: keyPair,
      signingAlgorithm: alg,
    });

    const fullURL = new URL(
      `${this.#baseURL}/v1/organizations/${this.org}/databases/${
        this.db
      }/branches/${this.branch}/certificates`
    );

    const displayName = `pscale-${nanoid()}`;

    const { response, body } = await postJSON<CertData>(
      fullURL,
      this.#headers,
      {
        csr: csr.toString(),
        display_name: displayName,
      }
    );

    const status = response.statusCode || 0;

    if (status < 200 || status > 299) {
      throw new Error(`HTTP ${status}`);
    }

    const addr = body.database_branch.access_host_url;

    const exportPrivateKey = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    const exportedAsString = String.fromCharCode.apply(
      null,
      Array.from(new Uint8Array(exportPrivateKey))
    );

    const exportedAsBase64 = base64encode(exportedAsString);

    const pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;

    return createConnection({
      ...this.connectionOptions,
      user: body.id,
      host: addr,
      database: this.db,
      ssl: {
        key: pemExported,
        cert: body.certificate,
        rejectUnauthorized: true,
      },
    });
  }
}

function postJSON<T>(
  url: URL,
  headers: Record<string, string>,
  body: unknown
): Promise<{ response: IncomingMessage; body: T }> {
  const json = JSON.stringify(body);

  const options = {
    hostname: url.host,
    port: 443,
    path: url.pathname,
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": json.length,
      "User-Agent": "planetscale/0.2.0",
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = request(options, (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ response, body: parsedBody });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(json);
    req.end();
  });
}

export default async function connect(
  config: PlanetScaleConfig,
  connectionOptions: ConnectionOptions = {}
) {
  const planetscale = new PlanetScale(config, connectionOptions);

  return planetscale.getConnection();
}

export type { ConnectionOptions } from "mysql2";
