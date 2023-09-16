// paypalService.ts
import axios, { AxiosResponse } from "axios"; 
import dotenv from "dotenv";
// import { redisClient } from "../config/redis.config"; 

dotenv.config();

// Define a type or interface for the subscription payload
interface PaypalSubscriptionPayload {
  plan_id: string;
  start_time?: string;
  quantity: string;
  shipping_amount: {
    currency_code: string;
    value: string;
  };
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    shipping_address: {
      name: {
        full_name: string;
      };
      address: {
        address_line_1: string;
        address_line_2: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  };
  application_context: {
    brand_name: string;
    locale: string;
    shipping_preference: string;
    user_action: string;
    payment_method: {
      payer_selected: string;
      payee_preferred: string;
    };
    return_url: string;
    cancel_url: string;
  };
}


class PaypalService {

  // Function to obtain the PayPal access token from an endpoint
  async getAccessToken(clientId: string, secret: string): Promise<string> {
    const authString = `${clientId}:${secret}`;
    const base64AuthString = Buffer.from(authString).toString("base64");

    const response: AxiosResponse = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${base64AuthString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = response.data;
    return access_token;
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createSubscription( paypalSubscriptionPayload: PaypalSubscriptionPayload): Promise<any> {
    const accessToken = await this.getAccessToken(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

    const payload = paypalSubscriptionPayload;

    const response: AxiosResponse = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/billing/subscriptions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "PayPal-Request-Id": "SUBSCRIPTION-QR-Conect",
          Prefer: "return=representation",
        },
      }
    );

    return response.data;
  }


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async cancelSubscription( reason: string, paypalSubscriptionId: string): Promise<any> {
    const accessToken = await this.getAccessToken(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
  
    const payload = reason;
  
    const response: AxiosResponse = await axios.post(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${paypalSubscriptionId}/cancel`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "PayPal-Request-Id": "SUBSCRIPTION-QR-Conect",
          "X-PAYPAL-SECURITY-CONTEXT": "{\"consumer\":{\"accountNumber\":1181198218909172527,\"merchantId\":\"5KW8F2FXKX5HA\"},\"merchant\":{\"accountNumber\":1659371090107732880,\"merchantId\":\"2J6QB8YJQSJRJ\"},\"apiCaller\":{\"clientId\":\"AdtlNBDhgmQWi2xk6edqJVKklPFyDWxtyKuXuyVT-OgdnnKpAVsbKHgvqHHP\",\"appId\":\"APP-6DV794347V142302B\",\"payerId\":\"2J6QB8YJQSJRJ\",\"accountNumber\":\"1659371090107732880\"},\"scopes\":[\"https://api-m.paypal.com/v1/subscription/.*\",\"https://uri.paypal.com/services/subscription\",\"openid\"]}",
        },
      }
    );
  
    return response.data;
  }

    
}

export default new PaypalService();




// Function to obtain the PayPal access token from an endpoint
//  async getAccessToken(clientId: string, secret: string): Promise<string> {
//   const redisKey = "paypal_access_token";

// Check if the access token is already cached in Redis
// const cachedToken = await new Promise<string>((resolve) => {
//   redisClient.get(redisKey, (error, token) => {
//     if (error) {
//       console.error("Redis error:", error);
//       resolve(null);
//     } else {
//       resolve(token);
//     }
//   });
// });

// if (cachedToken) {
//   return cachedToken;
// } else {
//   const authString = `${clientId}:${secret}`;
//   const base64AuthString = Buffer.from(authString).toString("base64");

//   const response: AxiosResponse = await axios.post(
//     "https://api-m.sandbox.paypal.com/v1/oauth2/token",
//     "grant_type=client_credentials",
//     {
//       headers: {
//         Authorization: `Basic ${base64AuthString}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     }
//   );

//   const { access_token, expires_in } = response.data;

//   // Cache the access token in Redis with an expiration time
//   // Use type assertion (as any) to bypass TypeScript type checking
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   redisClient.set(redisKey, access_token, "EX", expires_in as any);

//   return access_token;
// }
// }
