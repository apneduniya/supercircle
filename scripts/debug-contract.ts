#!/usr/bin/env npx tsx

import { contractService } from "../services/contract";

/**
 * Debug script to check contract status and help troubleshoot issues
 */
async function main() {
    console.log("🔍 SuperCircle Contract Debug Script");
    console.log("===================================");

    try {
        // Check initialization status
        console.log("\n1. Checking Contract Initialization...");
        const initStatus = await contractService.checkInitializationStatus();
        console.log(`   ${initStatus.message}`);
        
        if (!initStatus.isInitialized) {
            console.log("\n💡 To initialize the contract, run:");
            console.log("   npm run init-contract");
            console.log("\n   Make sure you have:");
            console.log("   ✓ DEPLOYER_PRIVATE_KEY in your .env file");
            console.log("   ✓ Sufficient APT balance for gas fees");
            return;
        }

        // Check vault address
        console.log("\n2. Checking Vault Address...");
        try {
            const vaultAddress = contractService.getVaultAddress();
            console.log(`   ⚠️  Vault Address (placeholder): ${vaultAddress}`);
            console.log(`   ℹ️  Note: Actual vault address is computed by the Move contract`);
        } catch (error) {
            console.log(`   ❌ Error getting vault address: ${error}`);
        }

        // Get all circles
        console.log("\n3. Fetching All Circles...");
        const circles = await contractService.getAllCircles();
        console.log(`   📊 Total Circles: ${circles.length}`);
        
        if (circles.length > 0) {
            console.log("\n   Circle Details:");
            circles.forEach((circle, index) => {
                console.log(`   ${index + 1}. ID: ${circle.id}`);
                console.log(`      Creator: ${circle.creator}`);
                console.log(`      Description: ${circle.description}`);
                console.log(`      Status: ${circle.status === 0 ? 'Pending' : circle.status === 1 ? 'Active' : 'Resolved'}`);
                console.log(`      Prize Pool: ${circle.prize_pool} APT`);
                console.log(`      Opponent: ${circle.opponent || 'None'}`);
                console.log(`      Resolved: ${circle.resolved ? 'Yes' : 'No'}`);
                console.log(`      Winner: ${circle.winner || 'None'}`);
                console.log("");
            });
        } else {
            console.log("   📝 No circles found. Try creating one!");
        }

        // Check pending circles
        console.log("4. Checking Pending Circles...");
        const pendingCircles = await contractService.getPendingCircles();
        console.log(`   ⏳ Pending Circles: ${pendingCircles.length}`);

        // Check active circles
        console.log("\n5. Checking Active Circles...");
        const activeCircles = await contractService.getActiveCircles();
        console.log(`   🔥 Active Circles: ${activeCircles.length}`);

        console.log("\n✅ Debug complete!");
        
    } catch (error) {
        console.error("❌ Debug script failed:", error);
        console.log("\n💡 Common issues:");
        console.log("   • Contract not initialized - run 'npm run init-contract'");
        console.log("   • Wrong network configuration in .env");
        console.log("   • Module address mismatch");
        console.log("   • Network connectivity issues");
    }
}

// Run the script
if (require.main === module) {
    main().catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    });
}

export default main; 