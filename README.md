This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SuperCircle Contract Setup

### Prerequisites

Before using the SuperCircle app, you need to initialize the smart contract. This is a **one-time setup** that must be done by the contract deployer.

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Aptos Contract Configuration
NEXT_PUBLIC_MODULE_ADDRESS=0xe785839a55cce9612dba46ac0394ef21a4ed232152e9a1a8679166073e0adf02
NEXT_PUBLIC_MODULE_NAME=SuperCircle_01
NEXT_PUBLIC_NETWORK=testnet

# AI Signer Configuration (for resolving circles)
NEXT_PUBLIC_AI_SIGNER_ADDRESS=

# Contract Initialization (Required for init-contract script)
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...
```

**Important**: Replace `DEPLOYER_PRIVATE_KEY` with the private key of the account that deployed the contract.

### 3. Initialize the Contract

Run the initialization script **once**:

```bash
npm run init-contract
```

This script will:
- ✅ Check if the contract is already initialized
- 🚀 Initialize the contract if needed
- 💰 Check your account balance
- 🔗 Provide transaction link
- ✅ Verify successful initialization

### 4. Script Output

```bash
🔧 SuperCircle Contract Initialization Script
=============================================
🔑 Using private key from environment variable
💰 Account Balance: 2.5 APT
🚀 Initializing SuperCircle contract...
📍 Module Address: 0xe785839a55cce9612dba46ac0394ef21a4ed232152e9a1a8679166073e0adf02
👤 Deployer Address: 0xb0f65...5c34810
🌐 Network: testnet
📝 Submitting initialization transaction...
📋 Transaction Hash: 0x123...abc
⏳ Waiting for transaction confirmation...
✅ Contract initialized successfully!
🔗 Transaction: https://explorer.aptoslabs.com/txn/0x123...abc?network=testnet
✅ Verification passed - CircleBook resource created!
🎉 Initialization completed successfully!
```

### 5. Troubleshooting

**Error: "Contract is already initialized!"**
- ✅ This is normal - the contract is already set up and ready to use.

**Error: "Invalid private key in environment variable"**
- ❌ Check that your `DEPLOYER_PRIVATE_KEY` is correct and starts with `0x`

**Error: "Low balance! Make sure you have enough APT for gas fees"**
- ❌ Add some APT to your deployer account for gas fees

**Error: "Generated account address doesn't match MODULE_ADDRESS"**
- ❌ Make sure you're using the correct deployer private key

### 6. After Initialization

Once initialized, users can:
- 🎯 Create challenges/circles
- 🤝 Accept challenges
- 💪 Join as supporters
- 🏆 Resolve circles (AI signer only)

The contract is now ready for use! 🎉
