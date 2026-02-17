# AGENT.md — FraudLabs Pro CLI for AI Agents

This document explains how to use the FraudLabs Pro CLI as an AI agent.

## Overview

The `fraudlabs` CLI provides access to the FraudLabs Pro fraud detection API. Use it to screen orders, submit feedback, and manage SMS verification.

## Prerequisites

Configure with your API key:

```bash
fraudlabs config set --api-key <key>
```

## All Commands

### Config

```bash
fraudlabs config set --api-key <key>
fraudlabs config show
```

### Order Screening

```bash
# Minimal screening (just IP)
fraudlabs order screen --ip 1.2.3.4

# With email
fraudlabs order screen --ip 1.2.3.4 --email customer@example.com

# Full screening
fraudlabs order screen \
  --ip 1.2.3.4 \
  --order-id ORD-001 \
  --amount 99.99 \
  --currency USD \
  --quantity 2 \
  --payment-method creditcard \
  --email customer@example.com \
  --first-name John \
  --last-name Doe \
  --phone +15551234567 \
  --bill-address "123 Main St" \
  --bill-city "New York" \
  --bill-state "NY" \
  --bill-country "US" \
  --bill-zip "10001" \
  --ship-address "456 Oak Ave" \
  --ship-city "Los Angeles" \
  --ship-state "CA" \
  --ship-country "US" \
  --ship-zip "90001"

# JSON output
fraudlabs order screen --ip 1.2.3.4 --email test@example.com --json
```

Payment methods: `creditcard`, `paypal`, `googlepay`, `applepay`, `bitcoin`

### Feedback

```bash
fraudlabs order feedback --id <fraud-id> --action APPROVE
fraudlabs order feedback --id <fraud-id> --action REJECT
fraudlabs order feedback --id <fraud-id> --action REJECT_BLACKLIST
fraudlabs order feedback --id <fraud-id> --action REJECT --note "Confirmed fraud"
```

Feedback actions: `APPROVE`, `REJECT`, `REJECT_BLACKLIST`

### SMS Verification

```bash
fraudlabs sms send --phone +15551234567
fraudlabs sms send --phone +15551234567 --country-code US
fraudlabs sms send --phone +15551234567 --type VOICE

fraudlabs sms verify --phone +15551234567 --otp 123456
```

## JSON Output

Always use `--json` when parsing results programmatically:

```bash
fraudlabs order screen --ip 1.2.3.4 --json
```

## Understanding Results

Key response fields:
- `fraudlabspro_id` — Unique fraud check ID (needed for feedback)
- `fraudlabspro_status` — `APPROVE`, `REVIEW`, or `REJECT`
- `fraudlabspro_score` — Risk score 0-100 (higher = more risky)
- `ip_geolocation.is_proxy` — Whether IP is a proxy
- `ip_geolocation.is_vpn` — Whether IP is a VPN
- `email_validation.is_disposable` — Whether email is disposable

## Example Workflows

### Screen and decide

```bash
RESULT=$(fraudlabs order screen --ip 1.2.3.4 --email customer@example.com --json)
STATUS=$(echo $RESULT | jq -r '.fraudlabspro_status')
ID=$(echo $RESULT | jq -r '.fraudlabspro_id')

if [ "$STATUS" = "APPROVE" ]; then
  echo "Order approved"
elif [ "$STATUS" = "REJECT" ]; then
  echo "Order rejected"
  fraudlabs order feedback --id $ID --action REJECT
fi
```

## Error Handling

The CLI exits with code 1 on error. Common errors:

- `API key not configured` — Run `fraudlabs config set --api-key <key>`
- `Authentication failed` — Check your API key
- `Rate limit exceeded` — Upgrade your plan or wait

## Notes

- Provide as many order details as possible for more accurate results
- Always submit feedback after reviewing screened orders to improve accuracy
- Free plan has limited queries per month
