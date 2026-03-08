import Stripe from 'stripe';
import PaystackPkg from 'paystack-api';
// @ts-ignore
const Paystack = (PaystackPkg as any).Paystack || PaystackPkg;
import { storage } from './storage';
import { db } from './db';
import { users, walletTransactions } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    // @ts-ignore
    apiVersion: '2025-01-27.acacia',
});

const paystack = process.env.PAYSTACK_SECRET_KEY ? new Paystack(process.env.PAYSTACK_SECRET_KEY) : null;

export async function processStripePayment(userId: string, amount: number, paymentMethodId: string) {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            }
        });

        if (paymentIntent.status === 'succeeded') {
            await storage.createTransaction({
                userId,
                amount: String(amount),
                type: 'deposit_stripe',
                status: 'completed',
                metadata: { paymentIntentId: paymentIntent.id }
            });
            return { success: true, transactionId: paymentIntent.id };
        } else {
            return { success: false, message: 'Payment failed' };
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function initializePaystackTransaction(userId: string, amount: number, email: string) {
    if (!paystack) return { success: false, message: 'Paystack not configured' };

    try {
        const response = await paystack.transaction.initialize({
            email,
            amount: amount * 100, // Paystack expects kobo/cents
            currency: 'NGN'
        });

        return { success: true, authorizationUrl: response.data.authorization_url, reference: response.data.reference };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function verifyPaystackTransaction(reference: string) {
    if (!paystack) return { success: false, message: 'Paystack not configured' };

    try {
        const response = await paystack.transaction.verify({ reference });
        if (response.data.status === 'success') {
            // Find user by email or metadata - simplified for now
            // In a real app, you'd store the reference with the user ID pending
            return { success: true, amount: response.data.amount / 100 };
        }
        return { success: false, message: 'Transaction not successful' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Webhook handler (stub)
export async function handleStripeWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Fulfill logic here if using async confirmation
    }
}
