// paypalService.ts
import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import { redisClient } from "../config/redis.config";

dotenv.config();

const webhookId =  process.env.PAYPAL_WEBHOOK_ID;

// Define a type or interface for the subscription payload
interface PaypalSubscriptionPayload {
  plan_id: string;
  custom_id: string;
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

// Define the type for your webhook body
interface WebhookBody {
  transmission_id: string;
  transmission_time: string;
  cert_url: string;
  auth_algo: string;
  transmission_sig: string;
  webhook_id?: string;
  webhook_event: {
    id: string;
    create_time: string;
    resource_type: string;
    event_type: string;
    summary: string;
    resource: {
      id: string;
      create_time: string;
      update_time: string;
      state: string;
      amount: {
        total: string;
        currency: string;
        details: {
          subtotal: string;
        };
      };
      parent_payment: string;
      valid_until: string;
      links: {
        href: string;
        rel: string;
        method: string;
      }[];
    };
  };
}
class PaypalService {
  // Function to obtain the PayPal access token from an endpoint
  async getAccessToken(clientId: string, secret: string): Promise<string> {
    const redisKey = "paypal_access_token";

    // Check if the access token is already cached in Redis
    const cachedToken = await redisClient.get(redisKey);

    if (cachedToken) {
      return cachedToken;
    }

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

    const { access_token, expires_in } = response.data;

    // Cache the access token in Redis with an expiration time
    // Use type assertion (as any) to bypass TypeScript type checking

    await redisClient.set(redisKey, access_token, {
      EX: expires_in,
      NX: true,
    });
    return access_token;
  }

  async createSubscription(
    paypalSubscriptionPayload: PaypalSubscriptionPayload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const accessToken = await this.getAccessToken(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_SECRET
    );

    
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

  async cancelSubscription(
    reason: string,
    subscribedIdFromPaypal: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const accessToken = await this.getAccessToken(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_SECRET
    );
    const payload = {
      reason: reason,
    };
  
    const response: AxiosResponse = await axios.post(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscribedIdFromPaypal}/cancel`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "PayPal-Request-Id": "SUBSCRIPTION-QR-Conect",
          // "X-PAYPAL-SECURITY-CONTEXT": securityContext,
        },
      }
    );
    return response;
  }

  async activateSubscription(
    reason: string,
    subscribedIdFromPaypal: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const accessToken = await this.getAccessToken(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_SECRET
    );
    const payload = {
      reason: reason,
    };
  
    const response: AxiosResponse = await axios.post(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscribedIdFromPaypal}/activate`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "PayPal-Request-Id": "SUBSCRIPTION-QR-Conect",
          // "X-PAYPAL-SECURITY-CONTEXT": securityContext,
        },
      }
    );
    return response;
  }

 
  //paypal webhook function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async paypalWebhook(headers: any, body: any): Promise<any> {
    const accessToken = await this.getAccessToken(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_SECRET
    );

    const transmission_sig = headers["paypal-transmission-sig"];
    const transmission_id = headers["paypal-transmission-id"];
    const transmission_time = headers["paypal-transmission-time"];
    const cert_url = headers["paypal-cert-url"];
    const auth_algo =  headers["paypal-auth-algo"]; 
    const webhook_id = webhookId

    const payload: WebhookBody = {
      transmission_id,
      transmission_time,
      cert_url,
      auth_algo,
      transmission_sig,
      webhook_id,
      webhook_event: JSON.parse(body), // parse the JSON body
    };

    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

}

export default new PaypalService();
