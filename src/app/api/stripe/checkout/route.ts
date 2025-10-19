import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_SECRET_KEY_HERE')) {
      return NextResponse.json(
        { error: "Stripe is niet geconfigureerd. Voeg je Stripe keys toe aan de .env file." },
        { status: 500 }
      );
    }

    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Niet ingelogd" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Check if user already has active subscription
    if (user.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "Je hebt al een actief abonnement" },
        { status: 400 }
      );
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          companyName: user.companyName || "",
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'ideal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'WeerOmzet Pro',
              description: 'Maandelijks abonnement voor omzet analyse',
            },
            unit_amount: 1000, // €10.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription/cancel`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan bij het aanmaken van de checkout sessie" },
      { status: 500 }
    );
  }
}