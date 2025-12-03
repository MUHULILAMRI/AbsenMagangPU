import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Handles incoming webhooks.
 *
 * @param request The incoming Next.js request object.
 * @returns A Next.js response object.
 */
export async function POST(request: NextRequest) {
  // 1. Validate the webhook token for security
  const token = request.headers.get('x-webhook-token');
  if (token !== process.env.WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // 2. Parse the request body
    const body = await request.json();
    console.log('Webhook body:', body); // Log for debugging

    // 3. Process the webhook payload as needed
    // For example, you might update your database based on the event type in the body.
    // switch (body.type) {
    //   case 'payment.succeeded':
    //     // Update order status in your DB
    //     break;
    //   case 'user.deleted':
    //     // Deactivate user in your DB
    //     break;
    //   default:
    //     // Unhandled event type
    //     break;
    // }

    // 4. Return a success response
    return NextResponse.json({ ok: true, message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Return an error response if the body is not valid JSON or another error occurs
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
  }
}
