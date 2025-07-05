import { Network } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS = process.env.MODULE_ADDRESS || "";
export const AI_SIGNER_ADDRESS = process.env.AI_SIGNER_ADDRESS || "";
export const NETWORK = process.env.NETWORK || "devnet";
export const APTOS_NETWORK: Network = NETWORK === "devnet" ? Network.DEVNET : NETWORK === "mainnet" ? Network.MAINNET : Network.TESTNET;
export const APT_TO_OCTA=100_000_000