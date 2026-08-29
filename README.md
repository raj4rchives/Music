# EXAMYWEB Premium Portal

A premium SaaS/client-area style front portal inspired by modern WHMCS/Lagom-style layouts, built around the existing study tracker.

## Flow
Landing → Signup/Login → Plan → UPI/Paytm Checkout → payment verification → tracker.html

## UPI
Configured display/intent UPI ID: `6900365026@superyes`

The UPI button creates a standard `upi://pay` intent. UTR submissions are stored locally as PENDING in this demo. For production, replace this with a backend that verifies payment before granting access.

## Paytm
The UI contains a Paytm tab/placeholder. Live Paytm requires server-side credentials and transaction verification. Never put a Paytm merchant key in frontend code.

## Existing tracker
The original tracker is preserved as `tracker.html`, with its `script.js`, `style.css`, and `manifest.json`.

## Production checklist
- Real authentication backend
- Database for users/subscriptions
- UPI/payment-provider verification or webhook
- Paytm server integration if desired
- Server-side subscription expiry/access control
- HTTPS
