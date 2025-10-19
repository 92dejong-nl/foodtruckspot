import Stripe from 'stripe';

// Graceful fallback for build time when env vars might not be set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_SECRET_KEY_HERE') || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    throw new Error('Please set your real Stripe secret key in the .env file. Get it from https://dashboard.stripe.com/test/apikeys');
  }
  return stripe;
};