import axios from "axios";
import { Stripe } from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
const PERCENTAGE_CHARGE = 0.05;

interface BankResolution {
  account_number: string;
  account_name: string;
  bank_id: number;
}

interface CreateSubAccountResponse {
  id: string;
  business_name: string;
  account_number: string;
  percentage_charge: number;
  settlement_bank: string;
}

type UpdateSubaccountResponse = CreateSubAccountResponse;

interface CreateSubAccountData {
  accountNumber: string;
  bankCode: string;
  businessName?: string;
  percentageCharge?: number;
}

interface InitiatePaymentOptions {
  amount: number;
  currency: string;
  payment_method_types: string[];
  transfer_data: {
    destination: string;
  };
//   metadata: {
//     orderId: number;
//     firstName: string;
//     lastName: string;
//     products: string[];
//   };
}

class StripeService {
  private stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2020-08-27",
  });

  // adding of banks
  async resolveBank(accountNumber: string): Promise<BankResolution | null> {
    try {
      const response = await axios.get<BankResolution>(
        `https://api.stripe.com/v1/issuing/cardholders/${accountNumber}`,
        {
          auth: {
            username: stripeSecretKey,
            password: "",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  async getAllBanks(): Promise<BankResolution[] | null> {
    // Stripe doesn't provide a direct way to retrieve a list of supported banks.
    // You might need to maintain your own list of supported banks.
    return null;
  }

  //creating sub account for business to send their funds to
  async createSubaccount(data: CreateSubAccountData): Promise<CreateSubAccountResponse | null> {
    try {
      const response = await this.stripe.accounts.create({
        type: "custom",
        country: "US", // Change to your appropriate country
        business_type: "individual",
        business_profile: {
          mcc: "5734", // Replace with appropriate mcc
          url: data.businessName,
        },
        individual: {
          address: {
            city: "City",
            line1: "Line 1",
            postal_code: "12345",
            state: "State",
          },
          dob: {
            day: 1,
            month: 1,
            year: 1990,
          },
          email: "email@example.com",
          first_name: "First Name",
          last_name: "Last Name",
          id_number: "1234567890", // Replace with appropriate ID number
          phone: "+1234567890", // Replace with appropriate phone number
        },
        external_account: {
          object: "bank_account",
          country: "US", // Change to your appropriate country
          currency: "usd",
          routing_number: "110000000", // Replace with appropriate routing number
          account_number: data.accountNumber,
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: "0.0.0.0", // Replace with appropriate IP address
        },
        metadata: {
          percentage_charge: data.percentageCharge || PERCENTAGE_CHARGE,
        },
      });
      return {
        id: response.id,
        business_name: response.business_profile?.url || "",
        account_number: data.accountNumber,
        percentage_charge: data.percentageCharge || PERCENTAGE_CHARGE,
        settlement_bank: response.external_accounts?.data[0]?.routing_number || "",
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async updateSubaccount(subaccountId: string, data: Omit<CreateSubAccountData, "businessId">): Promise<UpdateSubaccountResponse | null> {
    try {
      const response = await this.stripe.accounts.update(subaccountId, {
        business_profile: {
          mcc: "5734", // Replace with appropriate mcc
          url: data.businessName,
        },
        external_account: {
          object: "bank_account",
          country: "US", // Change to your appropriate country
          currency: "usd",
          routing_number: "110000000", // Replace with appropriate routing number
          account_number: data.accountNumber,
        },
        metadata: {
          percentage_charge: data.percentageCharge || PERCENTAGE_CHARGE,
        },
      });
      return {
        id: response.id,
        business_name: response.business_profile?.url || "",
        account_number: data.accountNumber,
        percentage_charge: data.percentageCharge || PERCENTAGE_CHARGE,
        settlement_bank: response.external_accounts?.data[0]?.routing_number || "",
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // initiate the Order Payment
  async initiateOrderPayment( options: InitiatePaymentOptions): Promise<string | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency,
        payment_method_types: options.payment_method_types,
        transfer_data: options.transfer_data,
         metadata: Stripe.MetadataParam; // Use the Stripe type for metadata

      });
      return paymentIntent.client_secret;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // initiate the subscription Payment
  
}

export default new StripeService();
