import express from "express";
import WebhookController from "../controllers/webhook.controller";

const webhookRouter = express.Router();

webhookRouter.post("/paypal", WebhookController.paypalWebhook);

webhookRouter.post("/stripe", WebhookController.stripeWebhook);

export default webhookRouter;
