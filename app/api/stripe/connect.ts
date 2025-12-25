// pages/api/stripe/connect.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-10-29.clover" });
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { providerId } = req.body;

  if (!providerId) {
    return res.status(400).json({ error: "Provider ID is required" });
  }

  try {
    // 1️⃣ Fetch the provider from DB
    let provider = await prisma.provider.findUnique({ where: { id: providerId } });

    // 2️⃣ If no stripeAccountId yet, create a new Stripe account
    if (!provider?.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express", // Express accounts are easiest for onboarding
        country: "MY",    // your country
        email: provider?.email,
      });

      // Save stripeAccountId in DB
      await prisma.provider.update({
        where: { id: providerId },
        data: { stripeAccountId: account.id },
      });

      provider = { ...provider, stripeAccountId: account.id };
    }

    // 3️⃣ Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: provider.stripeAccountId!,
      refresh_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/withdraw`,
      return_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/withdraw?success=true`,
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe onboarding failed" });
  }
}