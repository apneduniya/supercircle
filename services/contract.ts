/* eslint-disable @typescript-eslint/no-explicit-any */
import { APTOS_NETWORK, MODULE_ADDRESS, MODULE_NAME, APT_TO_OCTA } from "@/data/constant";
import { Aptos, AptosConfig, Account, MoveString, U64, U8 } from "@aptos-labs/ts-sdk";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";


export interface Circle {
    id: number;
    creator: string;
    opponent: string | null;
    description: string;
    deadline: number;
    created_at: number;
    creator_stake: number;
    opponent_stake: number;
    creator_supporter_pct: number;
    opponent_supporter_pct: number;
    creator_supporters: Supporter[];
    opponent_supporters: Supporter[];
    resolved: boolean;
    winner: string | null;
    status: number;
    prize_pool: number;
}

export interface Supporter {
    addr: string;
    amount: number;
    joined_at: number;
}

export enum SuperCircleMethods {
    INIT = "init",
    CREATE_CIRCLE = "create_circle",
    ACCEPT_CIRCLE = "accept_circle",
    JOIN_AS_SUPPORTER = "join_as_supporter",
    RESOLVE_CIRCLE = "resolve_circle",
    GET_VAULT_ADDRESS = "get_vault_addr",
    GET_SUPPORTER_MAX_ALLOC_AMOUNT = "get_supporter_max_alloc_amount",
    GET_REMAINING_ELIGIBLE_SUPPORTER_STAKE_AMOUNT = "get_remaining_eligible_supporter_stake_amount",
    IS_DEADLINE_PASSED = "is_deadline_passed",
    GET_CIRCLE_ID_BY_DESCRIPTION = "get_circle_id_by_description",
    IS_VALID_CIRCLE_ID = "is_valid_circle_id",
    GET_TOTAL_CIRCLES_COUNT = "get_total_circles_count",
    CIRCLE_EXISTS = "circle_exists",
    GET_CIRCLE_STATUS = "get_circle_status",
    GET_CIRCLE_CREATOR = "get_circle_creator",
    IS_CIRCLE_CREATOR = "is_circle_creator",
}

export class ContractService {
    private aptosClient: AptosConfig;
    private aptos: Aptos;
    private moduleAddress: string;
    private moduleName: string;

    constructor() {
        this.aptosClient = new AptosConfig({
            network: APTOS_NETWORK,
        });
        this.aptos = new Aptos(this.aptosClient);
        this.moduleAddress = MODULE_ADDRESS;
        this.moduleName = MODULE_NAME;
    }

    // ================================= Entry Functions ================================== //

    /**
     * Initialize the SuperCircle module (must be called by contract deployer first)
     */
    initTransaction(): InputTransactionData {
        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.INIT}`,
                functionArguments: []
            }
        };

        return payload;
    }

    /**
     * Create a new circle/challenge
     * Note: Description is automatically converted to lowercase for consistent searching
     */
    createCircleTransaction(
        description: string,
        deadline: number,
        creatorSupporterPct: number,
        prizePoolInApt: number
    ): InputTransactionData {
        const prizePoolInOcta = Math.floor(prizePoolInApt * APT_TO_OCTA);

        // Validate and ensure creatorSupporterPct is a valid number
        const validSupporterPct = Math.max(0, Math.min(100, Math.floor(creatorSupporterPct || 0)));
        
        console.log("Creating circle transaction with:", {
            description: description.toLowerCase(),
            deadline,
            creatorSupporterPct: validSupporterPct,
            prizePoolInOcta
        });
        console.log( new U8(validSupporterPct))

        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.CREATE_CIRCLE}`,
                functionArguments: [
                    new MoveString(description.toLowerCase()),
                    new U64(deadline),
                    new U8(validSupporterPct).value,
                    new U64(prizePoolInOcta)
                ]
            }
        };

        return payload;
    }

    /**
     * Accept a circle/challenge
     */
    acceptCircleTransaction(
        circleId: number,
        opponentSupporterPct: number
    ): InputTransactionData {
        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.ACCEPT_CIRCLE}`,
                functionArguments: [
                    new U64(circleId),
                    new U8(opponentSupporterPct).value
                ]
            }
        };

        return payload;
    }

    /**
     * Join as a supporter for a circle
     */
    joinAsSupporterTransaction(
        circleId: number,
        side: number, // 0 = creator, 1 = opponent
        amountInApt: number
    ): InputTransactionData {
        const amountInOcta = Math.floor(amountInApt * APT_TO_OCTA);

        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.JOIN_AS_SUPPORTER}`,
                functionArguments: [
                new U64(circleId),
                new U8(side).value,
                new U64(amountInOcta)
                ]
            }
        };

        return payload;
    }

    /**
     * Resolve a circle (only callable by AI signer)
     */
    resolveCircleTransaction(
        circleId: number,
        winner: string
    ): InputTransactionData {
        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.RESOLVE_CIRCLE}`,
                functionArguments: [
                new U64(circleId),
                winner
                ]
            }
        };

        return payload;
    }

    // ================================= View Functions ================================== //

    /**
     * Get the vault address (Note: computed client-side, may not be 100% accurate)
     */
    getVaultAddress(): string {
        // Note: The vault address is computed by the Move contract using:
        // object::create_object_address(&@supercircle_addr, VAULT_SEED)
        // where VAULT_SEED = b"vault"
        // 
        // For debugging purposes, we'll return a placeholder
        // The actual vault address is used internally by the contract
        console.warn("Vault address computation not implemented - this is for debugging only");
        return `${this.moduleAddress}::vault_placeholder`;
    }

    /**
     * Get the maximum amount of stake that a supporter can allocate to a side
     */
    async getSupporterMaxAllocAmount(circleId: number, side: number): Promise<number> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_SUPPORTER_MAX_ALLOC_AMOUNT}`,
                functionArguments: [
                    new U64(circleId),
                    new U8(side).value
                ]
            }
        });

        return parseInt(result[0] as string) / APT_TO_OCTA;
    }

    /**
     * Get the remaining eligible supporter stake amount for a side
     */
    async getRemainingEligibleSupporterStakeAmount(circleId: number, side: number): Promise<number> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_REMAINING_ELIGIBLE_SUPPORTER_STAKE_AMOUNT}`,
                functionArguments: [
                    new U64(circleId),
                    new U8(side).value
                ]
            }
        });

        return parseInt(result[0] as string) / APT_TO_OCTA;
    }

    /**
     * Check if the deadline has passed for a circle
     */
    async isDeadlinePassed(circleId: number): Promise<boolean> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.IS_DEADLINE_PASSED}`,
                functionArguments: [
                    new U64(circleId)
                ]
            }
        });

        return result[0] as boolean;
    }

    /**
     * Get circle ID by description (case-insensitive via client-side conversion)
     * Returns the circle ID if found, otherwise returns a special "not found" value
     * Use isValidCircleId() to check if the returned ID is valid
     * Note: Converts to lowercase on client side to achieve case-insensitive matching
     * since Move stdlib doesn't support string case conversion
     */
    async getCircleIdByDescription(description: string): Promise<number> {
        console.log("Searching for description:", description.toLowerCase());
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_CIRCLE_ID_BY_DESCRIPTION}`,
                functionArguments: [
                    new MoveString(description.toLowerCase())
                ]
            }
        });

        console.log("Raw result from getCircleIdByDescription:", result);
        const circleId = parseInt(result[0] as string);
        console.log("Parsed circle ID:", circleId);
        return circleId;
    }

    /**
     * Check if a circle ID is valid (not the "not found" sentinel value)
     * The contract returns u64::MAX (18446744073709551615) for "not found"
     */
    async isValidCircleId(circleId: number): Promise<boolean> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.IS_VALID_CIRCLE_ID}`,
                functionArguments: [
                    new U64(circleId)
                ]
            }
        });

        return result[0] as boolean;
    }

    /**
     * Helper function to search for a circle by description (case-insensitive)
     * Returns the circle object if found, null otherwise
     * Note: Achieves case-insensitive matching by converting to lowercase on client side
     */
    async findCircleByDescription(description: string): Promise<Circle | null> {
        try {
            console.log("Finding circle by description:", description);
            const circleId = await this.getCircleIdByDescription(description);
            console.log("Found circle ID:", circleId);
            
            const isValid = await this.isValidCircleId(circleId);
            console.log("Circle ID is valid:", isValid);
            
            if (isValid) {
                const circle = await this.getCircleById(circleId);
                console.log("Found circle:", circle);
                return circle;
            }
            return null;
        } catch (error) {
            console.error("Error finding circle by description:", error);
            return null;
        }
    }

    /**
     * Get total number of circles in the CircleBook
     */
    async getTotalCirclesCount(): Promise<number> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_TOTAL_CIRCLES_COUNT}`,
                functionArguments: []
            }
        });

        return parseInt(result[0] as string);
    }

    /**
     * Check if a circle exists by ID
     */
    async circleExists(circleId: number): Promise<boolean> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.CIRCLE_EXISTS}`,
                functionArguments: [
                    new U64(circleId)
                ]
            }
        });

        return result[0] as boolean;
    }

    /**
     * Get circle status by ID
     * Returns: 0 = Pending, 1 = Active, 2 = Resolved, 255 = Not Found
     */
    async getCircleStatus(circleId: number): Promise<number> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_CIRCLE_STATUS}`,
                functionArguments: [
                    new U64(circleId)
                ]
            }
        });

        return parseInt(result[0] as string);
    }

    /**
     * Get circle creator address by ID
     */
    async getCircleCreator(circleId: number): Promise<string> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.GET_CIRCLE_CREATOR}`,
                functionArguments: [
                    new U64(circleId)
                ]
            }
        });

        return result[0] as string;
    }

    /**
     * Check if an address is the creator of a circle
     */
    async isCircleCreator(circleId: number, address: string): Promise<boolean> {
        const result = await this.aptos.view({
            payload: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.IS_CIRCLE_CREATOR}`,
                functionArguments: [
                    new U64(circleId),
                    address
                ]
            }
        });

        return result[0] as boolean;
    }

    // ================================= Helper Functions ================================== //

    /**
     * Get account APT balance
     */
    async getAccountBalance(accountAddress: string): Promise<number> {
        try {
            const balance = await this.aptos.getAccountCoinAmount({
                accountAddress,
                coinType: "0x1::aptos_coin::AptosCoin"
            });
            return balance / APT_TO_OCTA;
        } catch (error) {
            console.error("Error getting account balance:", error);
            return 0;
        }
    }

    /**
     * Get account resource to check if CircleBook exists
     */
    async getCircleBook(): Promise<any> {
        try {
            const resource = await this.aptos.getAccountResource({
                accountAddress: this.moduleAddress,
                resourceType: `${this.moduleAddress}::${this.moduleName}::CircleBook`
            });
            return resource;
        } catch (error) {
            console.error("Error getting CircleBook:", error);
            return null;
        }
    }

    /**
     * Get all circles from the CircleBook
     */
    async getAllCircles(): Promise<Circle[]> {
        try {
            const circleBookResource = await this.getCircleBook();
            if (!circleBookResource) {
                console.log("CircleBook resource not found - contract may not be initialized");
                return [];
            }

            // Debug: Log the resource structure
            console.log("CircleBook resource structure:", JSON.stringify(circleBookResource, null, 2));

            // Handle different possible resource structures
            let circles: any[] = [];
            
            if (circleBookResource.data && circleBookResource.data.circles) {
                circles = circleBookResource.data.circles;
            } else if (circleBookResource.circles) {
                circles = circleBookResource.circles;
            } else {
                console.log("No circles found in resource structure");
                return [];
            }

            // If circles is empty, return empty array
            if (!circles || circles.length === 0) {
                console.log("No circles found in CircleBook");
                return [];
            }

            return circles.map((circle: any) => {
                // Validate and parse ID
                const parsedId = parseInt(circle.id);
                if (isNaN(parsedId) || parsedId < 0) {
                    console.error("Invalid circle ID found:", circle.id);
                    throw new Error(`Invalid circle ID: ${circle.id}`);
                }

                return {
                    id: parsedId,
                    creator: circle.creator,
                    opponent: circle.opponent && circle.opponent.vec && circle.opponent.vec.length > 0 ? circle.opponent.vec[0] : null,
                    description: circle.description,
                    deadline: parseInt(circle.deadline),
                    created_at: parseInt(circle.created_at),
                    creator_stake: parseInt(circle.creator_stake) / APT_TO_OCTA,
                    opponent_stake: parseInt(circle.opponent_stake) / APT_TO_OCTA,
                    creator_supporter_pct: parseInt(circle.creator_supporter_pct),
                    opponent_supporter_pct: parseInt(circle.opponent_supporter_pct),
                    creator_supporters: (circle.creator_supporters || []).map((s: any) => ({
                        addr: s.addr,
                        amount: parseInt(s.amount) / APT_TO_OCTA,
                        joined_at: s.joined_at ? parseInt(s.joined_at) : 0
                    })),
                    opponent_supporters: (circle.opponent_supporters || []).map((s: any) => ({
                        addr: s.addr,
                        amount: parseInt(s.amount) / APT_TO_OCTA,
                        joined_at: s.joined_at ? parseInt(s.joined_at) : 0
                    })),
                    resolved: circle.resolved,
                    winner: circle.winner && circle.winner.vec && circle.winner.vec.length > 0 ? circle.winner.vec[0] : null,
                    status: parseInt(circle.status),
                    prize_pool: parseInt(circle.prize_pool) / APT_TO_OCTA
                };
            });
        } catch (error) {
            console.error("Error getting all circles:", error);
            console.error("Error details:", error);
            return [];
        }
    }

    /**
     * Get a specific circle by ID
     */
    async getCircleById(circleId: number): Promise<Circle | null> {
        try {
            const circles = await this.getAllCircles();
            return circles.find(circle => circle.id === circleId) || null;
        } catch (error) {
            console.error("Error getting circle by ID:", error);
            return null;
        }
    }

    /**
     * Get circles by creator
     */
    async getCirclesByCreator(creatorAddress: string): Promise<Circle[]> {
        try {
            const circles = await this.getAllCircles();
            return circles.filter(circle => circle.creator === creatorAddress);
        } catch (error) {
            console.error("Error getting circles by creator:", error);
            return [];
        }
    }

    /**
     * Get circles by opponent
     */
    async getCirclesByOpponent(opponentAddress: string): Promise<Circle[]> {
        try {
            const circles = await this.getAllCircles();
            return circles.filter(circle => circle.opponent === opponentAddress);
        } catch (error) {
            console.error("Error getting circles by opponent:", error);
            return [];
        }
    }

    /**
     * Get active circles (not resolved)
     */
    async getActiveCircles(): Promise<Circle[]> {
        try {
            const circles = await this.getAllCircles();
            return circles.filter(circle => !circle.resolved);
        } catch (error) {
            console.error("Error getting active circles:", error);
            return [];
        }
    }

    /**
     * Get pending circles (waiting for opponent)
     */
    async getPendingCircles(): Promise<Circle[]> {
        try {
            const circles = await this.getAllCircles();
            return circles.filter(circle => circle.status === 0); // STATUS_PENDING
        } catch (error) {
            console.error("Error getting pending circles:", error);
            return [];
        }
    }

    /**
     * Check if module is initialized
     */
    async isModuleInitialized(): Promise<boolean> {
        try {
            const circleBook = await this.getCircleBook();
            return circleBook !== null;
        } catch (error) {
            console.error("Error checking if module is initialized:", error);
            return false;
        }
    }

    /**
     * Check initialization status with detailed info
     */
    async checkInitializationStatus(): Promise<{
        isInitialized: boolean;
        hasCircles: boolean;
        circleCount: number;
        message: string;
    }> {
        try {
            const circleBook = await this.getCircleBook();
            
            if (!circleBook) {
                return {
                    isInitialized: false,
                    hasCircles: false,
                    circleCount: 0,
                    message: "❌ Contract not initialized. Please run the initialization script first."
                };
            }

            // Check for circles
            let circles: any[] = [];
            if (circleBook.data && circleBook.data.circles) {
                circles = circleBook.data.circles;
            } else if (circleBook.circles) {
                circles = circleBook.circles;
            }

            return {
                isInitialized: true,
                hasCircles: circles.length > 0,
                circleCount: circles.length,
                message: circles.length > 0 
                    ? `✅ Contract initialized with ${circles.length} circle(s)`
                    : "✅ Contract initialized but no circles created yet"
            };
        } catch {
            return {
                isInitialized: false,
                hasCircles: false,
                circleCount: 0,
                message: "❌ Error checking initialization status"
            };
        }
    }

    /**
     * Get transaction by hash
     */
    async getTransactionByHash(transactionHash: string): Promise<any> {
        try {
            return await this.aptos.getTransactionByHash({
                transactionHash
            });
        } catch (error) {
            console.error("Error getting transaction by hash:", error);
            return null;
        }
    }

    /**
     * Simulate transaction without submitting
     */
    async simulateTransaction(signer: Account, payload: InputTransactionData): Promise<any> {
        try {
            const transaction = await this.aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: payload.data,
            });

            return await this.aptos.transaction.simulate.simple({
                signerPublicKey: signer.publicKey,
                transaction,
            });
        } catch (error) {
            console.error("Error simulating transaction:", error);
            return null;
        }
    }

    /**
     * Convert APT to Octa
     */
    aptToOcta(apt: number): number {
        return Math.floor(apt * APT_TO_OCTA);
    }

    /**
     * Convert Octa to APT
     */
    octaToApt(octa: number): number {
        return octa / APT_TO_OCTA;
    }

    /**
     * Format timestamp to readable date
     */
    formatTimestamp(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
    }

    /**
     * Get time ago string from timestamp
     */
    getTimeAgo(timestamp: number): string {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    /**
     * Get future time string from timestamp
     */
    futureTimeString(timestamp: number): string {
        const now = Math.floor(Date.now() / 1000);
        const diff = timestamp - now;
        if (diff < 60) return `in ${diff} seconds`;
        if (diff < 3600) return `in ${Math.floor(diff / 60)} minutes`;
        if (diff < 86400) return `in ${Math.floor(diff / 3600)} hours`;
        return `in ${Math.floor(diff / 86400)} days`;
    }

    /**
     * Check if circle is recently created (within last 24 hours)
     */
    isRecentlyCreated(circle: Circle): boolean {
        const now = Math.floor(Date.now() / 1000);
        const dayAgo = now - 86400; // 24 hours ago
        return circle.created_at > dayAgo;
    }

    /**
     * Get human-readable status string from status code
     */
    getStatusString(statusCode: number): string {
        switch (statusCode) {
            case 0: return "Pending";
            case 1: return "Active";
            case 2: return "Resolved";
            case 255: return "Not Found";
            default: return "Unknown";
        }
    }

    /**
     * Get comprehensive circle statistics
     */
    async getCircleStats(): Promise<{
        totalCircles: number;
        pendingCircles: number;
        activeCircles: number;
        resolvedCircles: number;
        recentCircles: number;
    }> {
        try {
            const totalCircles = await this.getTotalCirclesCount();
            const allCircles = await this.getAllCircles();
            
            const pendingCircles = allCircles.filter(c => c.status === 0).length;
            const activeCircles = allCircles.filter(c => c.status === 1).length;
            const resolvedCircles = allCircles.filter(c => c.status === 2).length;
            const recentCircles = allCircles.filter(c => this.isRecentlyCreated(c)).length;

            return {
                totalCircles,
                pendingCircles,
                activeCircles,
                resolvedCircles,
                recentCircles
            };
        } catch (error) {
            console.error("Error getting circle stats:", error);
            return {
                totalCircles: 0,
                pendingCircles: 0,
                activeCircles: 0,
                resolvedCircles: 0,
                recentCircles: 0
            };
        }
    }

    /**
     * Check if user can join a circle as supporter
     */
    async canJoinAsSupporter(circleId: number, side: number, amount: number): Promise<{
        canJoin: boolean;
        reason?: string;
        maxAmount?: number;
        remainingAmount?: number;
    }> {
        try {
            const exists = await this.circleExists(circleId);
            if (!exists) {
                return { canJoin: false, reason: "Circle does not exist" };
            }

            const status = await this.getCircleStatus(circleId);
            if (status !== 1) { // Not active
                return { canJoin: false, reason: "Circle is not active" };
            }

            const maxAmount = await this.getSupporterMaxAllocAmount(circleId, side);
            const remainingAmount = await this.getRemainingEligibleSupporterStakeAmount(circleId, side);

            if (amount > remainingAmount) {
                return { 
                    canJoin: false, 
                    reason: "Amount exceeds remaining allocation", 
                    maxAmount, 
                    remainingAmount 
                };
            }

            return { canJoin: true, maxAmount, remainingAmount };
        } catch (error) {
            console.error("Error checking supporter eligibility:", error);
            return { canJoin: false, reason: "Error checking eligibility" };
        }
    }

    /**
     * Validate circle ID and return detailed info
     */
    async validateCircleId(circleId: number): Promise<{
        isValid: boolean;
        exists: boolean;
        status?: number;
        statusString?: string;
        creator?: string;
    }> {
        try {
            const isValid = await this.isValidCircleId(circleId);
            const exists = await this.circleExists(circleId);
            
            if (!isValid || !exists) {
                return { isValid, exists };
            }

            const status = await this.getCircleStatus(circleId);
            const statusString = this.getStatusString(status);
            const creator = await this.getCircleCreator(circleId);

            return {
                isValid,
                exists,
                status,
                statusString,
                creator
            };
        } catch (error) {
            console.error("Error validating circle ID:", error);
            return { isValid: false, exists: false };
        }
    }
}

// Export a singleton instance
export const contractService = new ContractService();

/*
USAGE EXAMPLE:

// Step 1: Initialize the contract (must be done by contract deployer first)
// const initTx = contractService.initTransaction();
// Submit this transaction using your wallet

// Step 2: Create a circle
const createTx = contractService.createCircleTransaction(
    "Chess match challenge",
    Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    25, // 25% for supporters
    1 // 1 APT prize pool
);
// Submit this transaction using your wallet

// Step 3: Accept a circle
const acceptTx = contractService.acceptCircleTransaction(0, 30); // Circle ID 0, 30% for supporters
// Submit this transaction using your wallet

// Step 4: Join as supporter
const supportTx = contractService.joinAsSupporterTransaction(0, 0, 0.5); // Circle ID 0, creator side, 0.5 APT
// Submit this transaction using your wallet

// Step 5: Check circles
const circles = await contractService.getAllCircles();
console.log(circles);

// NEW FUNCTIONS ADDED:
// ==================

// Find circle by description (case-insensitive)
const foundCircle = await contractService.findCircleByDescription("Chess Match Challenge");

// Get circle stats
const stats = await contractService.getCircleStats();
console.log(`Total: ${stats.totalCircles}, Active: ${stats.activeCircles}, Pending: ${stats.pendingCircles}`);

// Check if user can join as supporter
const canJoin = await contractService.canJoinAsSupporter(0, 0, 0.5);
if (canJoin.canJoin) {
    console.log("User can join as supporter");
} else {
    console.log(`Cannot join: ${canJoin.reason}`);
}

// Validate circle ID
const validation = await contractService.validateCircleId(0);
console.log(`Circle 0 is ${validation.isValid ? 'valid' : 'invalid'} and ${validation.exists ? 'exists' : 'does not exist'}`);

// Check various circle properties
const totalCount = await contractService.getTotalCirclesCount();
const exists = await contractService.circleExists(0);
const status = await contractService.getCircleStatus(0);
const creator = await contractService.getCircleCreator(0);
const isCreator = await contractService.isCircleCreator(0, "0x123...");

// Note: The contract includes important fixes:
// - Fixed Move compilation error (break statement -> return statement)
// - Enhanced get_circle_id_by_description with client-side case-insensitive matching
// - Returns u64::MAX (18446744073709551615) for "not found" instead of 0
// - Added helper functions for validation and existence checks
// - Improved error handling and user experience
// - Achieves case-insensitive search by converting descriptions to lowercase on client side
// - All view functions properly marked with #[view] attribute for API access
*/


