/* eslint-disable @typescript-eslint/no-unused-vars */
import "server-only";

import { openai } from "@ai-sdk/openai";
import { VercelAIToolSet } from "composio-core";
import { generateText } from "ai";
import { Circle, ContractService } from "@/services/contract";
import { z } from "zod";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "@/data/constant";
import OpenAI from "openai";


export class AIJudgeServer {
    private toolset: VercelAIToolSet;
    private aiSigner: Account;
    private aptos: Aptos;

    constructor() {
        this.toolset = new VercelAIToolSet({
            apiKey: process.env.COMPOSIO_API_KEY,
        });

        // Initialize Aptos client
        const aptosConfig = new AptosConfig({
            network: APTOS_NETWORK,
        });
        this.aptos = new Aptos(aptosConfig);

        // Initialize AI signer account
        if (!process.env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("DEPLOYER_PRIVATE_KEY environment variable is required");
        }

        const privateKey = new Ed25519PrivateKey(process.env.DEPLOYER_PRIVATE_KEY);
        this.aiSigner = Account.fromPrivateKey({ privateKey });

        this.post_init();
    }

    private async post_init() {
        // resolve circle tool
        const resolveChallengeSchema = z.object({
            circle_id: z.number().describe("The ID of the challenge to resolve"),
            winner: z.enum(['creator', 'opponent']).describe("The winner of the challenge"),
        });

        await this.toolset.createAction({
            actionName: "resolve_challenge",
            description: "Resolve a challenge by giving the winner",
            inputParams: resolveChallengeSchema,
            callback: async (input, authCredentials, executeRequest) => {
                try {
                    // Safely access validated input (casting based on schema)
                    const params = input as z.infer<typeof resolveChallengeSchema>;

                    const contractService = new ContractService();
                    
                    // Get the challenge details to find the actual addresses
                    const challenge = await contractService.getCircleById(params.circle_id);
                    if (!challenge) {
                        throw new Error(`Challenge with ID ${params.circle_id} not found`);
                    }

                    // Convert winner enum to actual address
                    let winnerAddress: string;
                    if (params.winner === 'creator') {
                        winnerAddress = challenge.creator;
                    } else if (params.winner === 'opponent') {
                        if (!challenge.opponent) {
                            throw new Error(`Challenge ${params.circle_id} has no opponent`);
                        }
                        winnerAddress = challenge.opponent;
                    } else {
                        throw new Error(`Invalid winner: ${params.winner}`);
                    }

                    const transactionPayload = contractService.resolveCircleTransaction(params.circle_id, winnerAddress);

                    // Build, sign and submit the transaction
                    const transaction = await this.aptos.transaction.build.simple({
                        sender: this.aiSigner.accountAddress,
                        data: transactionPayload.data,
                    });

                    const response = await this.aptos.signAndSubmitTransaction({
                        signer: this.aiSigner,
                        transaction,
                    });

                    console.log(`Transaction submitted successfully: ${response.hash}`);

                    // Wait for transaction to be confirmed
                    await this.aptos.waitForTransaction({ transactionHash: response.hash });

                    return {
                        data: {
                            result: "Challenge resolved successfully",
                            transactionHash: response.hash,
                            winner: params.winner,
                            winnerAddress: winnerAddress,
                        },
                        successful: true,
                    };
                } catch (error) {
                    console.error("Error resolving challenge:", error);
                    return {
                        data: {
                            result: "Failed to resolve challenge",
                            error: error instanceof Error ? error.message : "Unknown error",
                        },
                        successful: false,
                    };
                }
            }
        });
    }

    // async judgeAssistant() {
    //     const tools = await this.toolset.getTools({
    //         apps: ['github'],
    //         actions: ['resolve_challenge'],
    //     });

    //     const assistant = await openai.beta.assistants.create({
    //         model: "gpt-4o",
    //         name: "Judge Assistant",
    //         instructions: "You are a judge assistant. You are responsible for judging the challenges. You will first research the challenge and after confirming the challenge is valid and you have enough information, then resolve the challenge.",
    //         tools: tools,
    //     });

    //     return assistant;
    // }

    async judge(challenge: Circle) {
        // const assistant = await this.judgeAssistant(this.openai);
        // const task = `
        // You are a judge assistant. You are responsible for judging the challenges.
        // The challenge is: ${challenge.description}
        // The challenge ID is: ${challenge.id}
        // `;

        // await this.executeAssistantTask(this.openai, this.toolset, assistant, task);

        const output = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: `
            You are a judge assistant. You are responsible for judging the challenges.
            The challenge is: ${challenge.description}
            The challenge ID is: ${challenge.id}
            `,
            tools: await this.toolset.getTools({
                apps: ['github', 'serpapi'],
                actions: ['resolve_challenge'],
            }),
        });

        console.log(output);
    }

    // async executeAssistantTask(openai: OpenAI, toolset: OpenAIToolSet, assistant: Assistant, task: string) {
    //     const thread = await openai.beta.threads.create();

    //     const run = await openai.beta.threads.runs.create(thread.id, {
    //         assistant_id: assistant.id,
    //         instructions: task,
    //         tools: this.tools,
    //         model: "gpt-4o",
    //         stream: false,
    //     });

    //     await toolset.waitAndHandleAssistantToolCalls(openai, run, thread);
    // }

}


