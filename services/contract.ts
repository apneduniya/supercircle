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
     */
    createCircleTransaction(
        description: string,
        deadline: number,
        creatorSupporterPct: number,
        prizePoolInApt: number
    ): InputTransactionData {
        const prizePoolInOcta = Math.floor(prizePoolInApt * APT_TO_OCTA);

        const payload: InputTransactionData = {
            data: {
                function: `${this.moduleAddress}::${this.moduleName}::${SuperCircleMethods.CREATE_CIRCLE}`,
                functionArguments: [
                    new MoveString(description),
                    new U64(deadline),
                    new U8(creatorSupporterPct),
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
                    new U8(opponentSupporterPct)
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
                new U8(side),
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
                    new U8(side)
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
                    new U8(side)
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

            return circles.map((circle: any) => ({
                id: parseInt(circle.id),
                creator: circle.creator,
                opponent: circle.opponent && circle.opponent.vec && circle.opponent.vec.length > 0 ? circle.opponent.vec[0] : null,
                description: circle.description,
                deadline: parseInt(circle.deadline),
                creator_stake: parseInt(circle.creator_stake) / APT_TO_OCTA,
                opponent_stake: parseInt(circle.opponent_stake) / APT_TO_OCTA,
                creator_supporter_pct: parseInt(circle.creator_supporter_pct),
                opponent_supporter_pct: parseInt(circle.opponent_supporter_pct),
                creator_supporters: (circle.creator_supporters || []).map((s: any) => ({
                    addr: s.addr,
                    amount: parseInt(s.amount) / APT_TO_OCTA
                })),
                opponent_supporters: (circle.opponent_supporters || []).map((s: any) => ({
                    addr: s.addr,
                    amount: parseInt(s.amount) / APT_TO_OCTA
                })),
                resolved: circle.resolved,
                winner: circle.winner && circle.winner.vec && circle.winner.vec.length > 0 ? circle.winner.vec[0] : null,
                status: parseInt(circle.status),
                prize_pool: parseInt(circle.prize_pool) / APT_TO_OCTA
            }));
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
*/


