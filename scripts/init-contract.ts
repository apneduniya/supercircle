#!/usr/bin/env npx tsx

import { Aptos, AptosConfig, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK, MODULE_ADDRESS, MODULE_NAME } from "../data/constant";
import dotenv from "dotenv";    

// Load environment variables
dotenv.config();

class ContractInitializer {
    private aptos: Aptos;
    private moduleAddress: string;
    private moduleName: string;

    constructor() {
        const config = new AptosConfig({ network: APTOS_NETWORK });
        this.aptos = new Aptos(config);
        this.moduleAddress = MODULE_ADDRESS;
        this.moduleName = MODULE_NAME;
    }

    /**
     * Check if the contract is already initialized
     */
    async isInitialized(): Promise<boolean> {
        try {
            const resource = await this.aptos.getAccountResource({
                accountAddress: this.moduleAddress,
                resourceType: `${this.moduleAddress}::${this.moduleName}::CircleBook`
            });
            return resource !== null;
        } catch {
            // If resource doesn't exist, contract is not initialized
            return false;
        }
    }

    /**
     * Initialize the contract
     */
    async initialize(deployerAccount: Account): Promise<void> {
        console.log("🚀 Initializing SuperCircle contract...");
        console.log(`📍 Module Address: ${this.moduleAddress}`);
        console.log(`👤 Deployer Address: ${deployerAccount.accountAddress.toString()}`);
        console.log(`🌐 Network: ${APTOS_NETWORK}`);

        try {
            // Check if already initialized
            const alreadyInitialized = await this.isInitialized();
            if (alreadyInitialized) {
                console.log("✅ Contract is already initialized!");
                return;
            }

            // Build the transaction
            const transaction = await this.aptos.transaction.build.simple({
                sender: deployerAccount.accountAddress,
                data: {
                    function: `${this.moduleAddress}::${this.moduleName}::init`,
                    functionArguments: []
                }
            });

            console.log("📝 Submitting initialization transaction...");

            // Sign and submit the transaction
            const committedTransaction = await this.aptos.signAndSubmitTransaction({
                signer: deployerAccount,
                transaction
            });

            console.log(`📋 Transaction Hash: ${committedTransaction.hash}`);
            console.log("⏳ Waiting for transaction confirmation...");

            // Wait for transaction to be confirmed
            const executedTransaction = await this.aptos.waitForTransaction({
                transactionHash: committedTransaction.hash
            });

            if (executedTransaction.success) {
                console.log("✅ Contract initialized successfully!");
                console.log(`🔗 Transaction: https://explorer.aptoslabs.com/txn/${committedTransaction.hash}?network=${APTOS_NETWORK}`);
                
                // Verify initialization
                const isNowInitialized = await this.isInitialized();
                if (isNowInitialized) {
                    console.log("✅ Verification passed - CircleBook resource created!");
                } else {
                    console.log("❌ Verification failed - CircleBook resource not found");
                }
            } else {
                console.log("❌ Transaction failed!");
                console.log("Error:", executedTransaction);
            }

        } catch (error) {
            console.error("❌ Error initializing contract");
            throw error;
        }
    }

    /**
     * Get account balance
     */
    async getAccountBalance(address: string): Promise<number> {
        try {
            const balance = await this.aptos.getAccountCoinAmount({
                accountAddress: address,
                coinType: "0x1::aptos_coin::AptosCoin"
            });
            return balance / 100_000_000; // Convert to APT
        } catch {
            return 0;
        }
    }
}

/**
 * Main function to run the initialization
 */
async function main() {
    console.log("🔧 SuperCircle Contract Initialization Script");
    console.log("=============================================");

    const initializer = new ContractInitializer();

    // Get deployer account from environment variable or generate new one
    let deployerAccount: Account;

    const privateKeyHex = process.env.DEPLOYER_PRIVATE_KEY;
    
    if (privateKeyHex) {
        console.log("🔑 Using private key from environment variable");
        try {
            const privateKey = new Ed25519PrivateKey(privateKeyHex);
            deployerAccount = Account.fromPrivateKey({ privateKey });
        } catch {
            console.error("❌ Invalid private key in environment variable");
            process.exit(1);
        }
    } else {
        console.log("⚠️  No DEPLOYER_PRIVATE_KEY found in environment variables");
        console.log("💡 Please set DEPLOYER_PRIVATE_KEY in your .env file");
        console.log("   Example: DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...");
        console.log("");
        console.log("🆕 Generating a new account for demonstration:");
        
        deployerAccount = Account.generate();
        console.log(`   Address: ${deployerAccount.accountAddress.toString()}`);
        // console.log(`   Private Key: ${deployerAccount.privateKey.toString()}`);
        console.log("   ⚠️  This account has no funds and cannot deploy!");
        console.log("");
        
        // Check if the module address matches the generated account
        if (deployerAccount.accountAddress.toString() !== MODULE_ADDRESS) {
            console.error("❌ Generated account address doesn't match MODULE_ADDRESS");
            console.error(`   Generated: ${deployerAccount.accountAddress.toString()}`);
            console.error(`   Expected: ${MODULE_ADDRESS}`);
            console.error("   Please use the correct deployer private key!");
            process.exit(1);
        }
    }

    // Check account balance
    const balance = await initializer.getAccountBalance(deployerAccount.accountAddress.toString());
    console.log(`💰 Account Balance: ${balance} APT`);

    if (balance < 0.01) {
        console.log("⚠️  Low balance! Make sure you have enough APT for gas fees");
    }

    // Initialize the contract
    try {
        await initializer.initialize(deployerAccount);
        console.log("🎉 Initialization completed successfully!");
    } catch (error) {
        console.error("💥 Initialization failed:", error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    });
}

export { ContractInitializer }; 