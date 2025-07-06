<h1 align="center">SuperCircle 🔥</h1>

<p align="center">A platform for creating stake‑backed friendly challenges with automatic settlement</p>

## 🎥 DEMO

Coming soon...

## 📦 Contract Details
Wallet Address: 0xe785839a55cce9612dba46ac0394ef21a4ed232152e9a1a8679166073e0adf02
Transaction link: https://explorer.aptoslabs.com/txn/0x5b725bef84c3af85cc850d107c88bdf7ae884e044a0ce28af2b4eb0ad858d551?network=testnet
Transaction hash: 0x5b725bef84c3af85cc850d107c88bdf7ae884e044a0ce28af2b4eb0ad858d551

## 📙 Features
- 🧠 **AI-Powered Challenge Resolution**: Automatically determines the winner of each challenge based on pre-defined criteria and real-world data.
- ⚔️ **Stake-Backed Friendly Challenges**: Create meaningful competitions with real money or rewards at stake—no need for manual judgment.
- 👥 **Peer Endorsements**: Allow friends to support participants with a share of the winnings, adding social validation and engagement.
- 💸 **Smart Payout System**: Distributes rewards automatically and fairly to winners and their endorsers; offers partial loss protection to losers backed by friends.
- 📅 **Time-Bound Competitions**: Set deadlines to keep challenges focused, goal-driven, and efficient.
- 🔗 **Seamless Integrations**: Connect with platforms like GitHub, Google Drive, and more to verify challenge outcomes effortlessly.

## 🤔 Why I used EduChain?
We chose Aptos for lightning‑fast finality, and low, predictable fees—so challenges settle instantly and securely. Its robust docs, SDKs, MCPs and active orgainers of the hackathon venue let us build and scale Supercircle with confidence.

**Building the trusted challenge layer on Aptos**

## 🤗 Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes.
4. Push your branch: `git push origin feature-name`.
5. Create a pull request.

## ✍ Acknowledgments
This project couldn't be there if they didn't be there!
- [Aptos](https://aptos.dev/)
- [Petra](https://petra.app/)
- [Composio](https://composio.dev/)
- [Aptos Hackathon](https://lu.ma/ct5ghfi3?locale=en-IN)

Even something was gone wrong while making this project but hackathon orgainser team helped me to over come the issues and I am really thankful to it!

## 🚀 Getting Started

Follow these steps to set up and run SuperCircle:

1. **Clone the repository**

```bash
git clone https://github.com/apneduniya/supercircle.git
cd supercircle
```

2. **Install dependencies**

```bash
bun install
```

If you plan to use contract scripts, you may also need:

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set the following variables:

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

**Important:** Replace `DEPLOYER_PRIVATE_KEY` with the private key of the account that deployed the contract.

4. **Initialize the contract (one-time setup, deployer only)**

Run the initialization script:

```bash
npm run init-contract
```

This script will:
- ✅ Check if the contract is already initialized
- 🚀 Initialize the contract if needed
- 💰 Check your account balance
- 🔗 Provide transaction link
- ✅ Verify successful initialization

Example output:

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

**Troubleshooting:**
- "Contract is already initialized!" — This is normal if the contract is already set up.
- "Invalid private key in environment variable" — Check that your `DEPLOYER_PRIVATE_KEY` is correct and starts with `0x`.
- "Low balance! Make sure you have enough APT for gas fees" — Add some APT to your deployer account.
- "Generated account address doesn't match MODULE_ADDRESS" — Make sure you're using the correct deployer private key.

5. **Run the development server**

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

6. **Set up the judge cron job**

Set up a cron job to ping [http://localhost:3000/api/judge](http://localhost:3000/api/judge) every minute to check for new challenges and resolve them.

---

Once initialized, users can:
- 🎯 Create challenges/circles
- 🤝 Accept challenges
- 💪 Join as supporters
- 🏆 Resolve circles (AI signer only)

The contract is now ready for use! 🎉

## 📚 Learn More

- [Aptos Documentation](https://aptos.dev/docs) - learn about Aptos features and API.
- [Aptos Hackathon](https://lu.ma/ct5ghfi3?locale=en-IN) - learn about Aptos hackathon.
- [Aptos Move](https://aptos.dev/move) - learn about Aptos Move.

## 🛳️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

