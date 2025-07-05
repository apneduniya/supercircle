import { Network } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || "0xe785839a55cce9612dba46ac0394ef21a4ed232152e9a1a8679166073e0adf02";
export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || "SuperCircle_02";
export const AI_SIGNER_ADDRESS = process.env.NEXT_PUBLIC_AI_SIGNER_ADDRESS || "";
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";
export const APTOS_NETWORK: Network = NETWORK === "devnet" ? Network.DEVNET : NETWORK === "mainnet" ? Network.MAINNET : Network.TESTNET;
export const APT_TO_OCTA=100_000_000;