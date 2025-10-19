import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('YOUR_SECRET_KEY_HERE')) {
    throw new Error('Please set your real Stripe secret key in the .env file. Get it from https://dashboard.stripe.com/test/apikeys');
  }
  return stripe;
};