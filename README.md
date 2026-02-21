> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# FraudLabs Pro CLI

A production-ready command-line interface for the [FraudLabs Pro](https://fraudlabspro.com) fraud detection API. Screen orders for fraud, submit feedback, and manage SMS verification directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by FraudLabs Pro.

## Features

- **Order Screening** — Screen orders for fraud with IP, email, billing/shipping validation
- **Feedback** — Approve or reject flagged orders to train the model
- **SMS Verification** — Send and verify OTP codes for customer authentication
- **JSON output** — All commands support `--json` for scripting and piping
- **Colorized output** — Clean, readable terminal output with chalk

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/fraudlabs
```

## Authentication Setup

FraudLabs Pro uses API key authentication.

### 1. Get your API key

1. Sign up at [fraudlabspro.com](https://fraudlabspro.com)
2. Log in to your dashboard and copy your API key

### 2. Configure the CLI

```bash
fraudlabs config set --api-key YOUR_API_KEY
```

## Commands

### Configuration

```bash
# Set API key
fraudlabs config set --api-key <key>

# Show current config
fraudlabs config show
```

### Order Screening

```bash
# Screen a basic order
fraudlabs order screen --ip 1.2.3.4 --email customer@example.com --order-id ORD-001

# Full order screening
fraudlabs order screen \
  --ip 1.2.3.4 \
  --order-id ORD-001 \
  --amount 99.99 \
  --currency USD \
  --email customer@example.com \
  --first-name John \
  --last-name Doe \
  --bill-address "123 Main St" \
  --bill-city "New York" \
  --bill-state "NY" \
  --bill-country "US" \
  --bill-zip "10001"

# Output as JSON
fraudlabs order screen --ip 1.2.3.4 --email test@example.com --json
```

### Feedback

```bash
# Approve a previously screened order
fraudlabs order feedback --id <fraud-id> --action APPROVE

# Reject an order
fraudlabs order feedback --id <fraud-id> --action REJECT

# Reject and blacklist
fraudlabs order feedback --id <fraud-id> --action REJECT_BLACKLIST --note "Confirmed fraud"
```

### SMS Verification

```bash
# Send OTP via SMS
fraudlabs sms send --phone +15551234567 --country-code US

# Send via voice call
fraudlabs sms send --phone +15551234567 --type VOICE

# Verify OTP code
fraudlabs sms verify --phone +15551234567 --otp 123456
```

## Understanding Fraud Scores

- **0-39**: Low risk — likely safe to approve
- **40-74**: Medium risk — manual review recommended
- **75-100**: High risk — likely fraudulent, consider rejection

Status values:
- **APPROVE** — Order appears legitimate
- **REVIEW** — Manual review recommended
- **REJECT** — Order appears fraudulent

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Screen order and extract key fields
fraudlabs order screen --ip 1.2.3.4 --email test@example.com --json | \
  jq '{id: .fraudlabspro_id, status: .fraudlabspro_status, score: .fraudlabspro_score}'

# Check if proxy
fraudlabs order screen --ip 1.2.3.4 --json | jq '.ip_geolocation.is_proxy'
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/fraudlabs](https://github.com/ktmcp-cli/fraudlabs).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.
