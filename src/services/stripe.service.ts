/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const yourBaseURL = process.env.BASE_URL!;

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2023-08-16",
});

class StripeService {
  // Function to create a checkout session and return the client secret
  async createCheckoutSession(
    price: number,
    order: string
  ): Promise<Stripe.Checkout.Session> {
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: "QR Connect",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        order,
      },
      mode: "payment",
      success_url: `${yourBaseURL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${yourBaseURL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
    };

    const session = await stripe.checkout.sessions.create(sessionCreateParams);

    console.log(session);

    return session;
  }

  // Function to retrieve session status
  async getSessionStatus(
    sessionId: string
  ): Promise<{ status: string; customer_email: string }> {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      status: session.payment_status,
      customer_email: session.customer_details?.email ?? "", // Handle potential null value
    };
  }
}

export default new StripeService();
