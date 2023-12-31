import emailQueue from "../queues/email.queue";
import { EmailJobData } from "../workers/email.worker";

interface ResetPasswordEmailData {
  email: string;
  firstName: string;
  otp: string;
}

interface OrderEmailData {
  email: string;
  orderNumber: string | number;
  transactionRef: string;
}

interface SubEmailData {
  email: string;
  price: number;
  expiryDate: Date;
  transactionRef: string;
}

class EmailService {
  //Reset password
  async resetPasswordEmail(data: ResetPasswordEmailData) {
    const jobData: EmailJobData = {
      subject: "Reset your Password",
      template: "reset_password",
      to: data.email,
      variables: {
        firstName: data.firstName,
        otp: data.otp,
      },
    };
    await emailQueue.add("reset-password", jobData);
  }

  //Success order
  async sendOrderSuccess(data: OrderEmailData) {
    const jobData: EmailJobData = {
      subject: "Order Purchase Success",
      template: "order_purchase_success",
      to: data.email,
      variables: {
        orderNumber: data.orderNumber,
        transactionRef: data.transactionRef,
      },
    };
    await emailQueue.add("order-purchase-suceess", jobData);
  }

  //Failed order
  async sendOrderFailed(data: OrderEmailData) {
    const jobData: EmailJobData = {
      subject: "Order Purchase Failed",
      template: "order_purchase_failed",
      to: data.email,
      variables: {
        orderNumber: data.orderNumber,
        transactionRef: data.transactionRef,
      },
    };
    await emailQueue.add("order-purchase-failed", jobData);
  }

  //new subscription
  async sendNewSubscriptionToBusiness(data: SubEmailData) {
    const jobData: EmailJobData = {
      subject: "New Subscription",
      template: "new_subscription",
      to: data.email,
      variables: {
        price: data.price,
        expiryDate: data.expiryDate,
        transactionRef: data.transactionRef,
      },
    };
    await emailQueue.add("new-subscription", jobData);
  }
  
}

export default new EmailService();
