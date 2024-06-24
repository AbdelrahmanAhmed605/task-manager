import jwkToPem from "jwk-to-pem";
import axios from "axios";
import jwt, { JwtPayload } from "jsonwebtoken";

interface DecodedJwt extends JwtPayload {
  iss: string;
  token_use: string;
}

class CognitoExpress {
  userPoolId!: string;
  tokenUse!: string;
  tokenExpiration!: number;
  iss!: string;
  hasFinishedProcessing!: Promise<void>;
  pems: Record<string, string> = {};

  constructor(config: any) {
    if (!config)
      throw new TypeError(
        "Options not found. Please refer to README for usage example at https://github.com/ghdna/cognito-express"
      );

    if (this.configurationIsCorrect(config)) {
      this.userPoolId = config.cognitoUserPoolId;
      this.tokenUse = config.tokenUse;
      this.tokenExpiration = config.tokenExpiration || 3600000;
      this.iss = `https://cognito-idp.${config.region}.amazonaws.com/${this.userPoolId}`;
      this.hasFinishedProcessing = this.init();
      this.pems = {};
    }
  }

  init(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.get(`${this.iss}/.well-known/jwks.json`);
        if (response.data.keys) {
          const keys = response.data.keys;
          for (let i = 0; i < keys.length; i++) {
            const key_id = keys[i].kid;
            const modulus = keys[i].n;
            const exponent = keys[i].e;
            const key_type = keys[i].kty;
            const jwk = {
              kty: key_type,
              n: modulus,
              e: exponent,
            };
            const pem = jwkToPem(jwk);
            this.pems[key_id] = pem;
          }
          resolve();
        } else {
          reject("No keys found in response");
        }
      } catch (err) {
        reject("Unable to generate certificate due to \n" + err);
      }
    });
  }

  async validate(token: string, callback?: (err: any, result?: any) => void): Promise<any> {
    await this.hasFinishedProcessing;
    return new Promise((resolve, reject) => {
      const decodedJwt = jwt.decode(token, { complete: true }) as { payload: DecodedJwt; header: { kid: string } } | null;
      try {
        if (!decodedJwt) throw new TypeError("Not a valid JWT token");

        if (decodedJwt.payload.iss !== this.iss)
          throw new TypeError("token is not from your User Pool");

        if (decodedJwt.payload.token_use !== this.tokenUse)
          throw new TypeError(`Not an ${this.tokenUse} token`);

        const kid = decodedJwt.header.kid;
        const pem = this.pems[kid];

        if (!pem) throw new TypeError(`Invalid ${this.tokenUse} token`);

        try {
          const result = jwt.verify(token, pem, {
            issuer: this.iss,
            maxAge: this.tokenExpiration,
          });
          if (callback) {
            callback(null, result);
          } else {
            resolve(result);
          }
        } catch (error) {
          if (callback) {
            callback(error, null);
          } else {
            reject(error);
          }
        }
      } catch (error) {
        if (callback) {
          callback(error, null);
        } else {
          reject(error);
        }
      }
    });
  }

  configurationIsCorrect(config: any): boolean {
    let configurationPassed = false;
    switch (true) {
      case !config.region:
        throw new TypeError("AWS Region not specified in constructor");

      case !config.cognitoUserPoolId:
        throw new TypeError("Cognito User Pool ID is not specified in constructor");

      case !config.tokenUse:
        throw new TypeError("Token use not specified in constructor. Possible values 'access' | 'id'");

      case !(config.tokenUse == "access" || config.tokenUse == "id"):
        throw new TypeError("Token use values not accurate in the constructor. Possible values 'access' | 'id'");

      default:
        configurationPassed = true;
    }
    return configurationPassed;
  }
}

export default CognitoExpress;
