"use client";

import { AptosWalletAdapterProvider, DappConfig } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { useClaimSecretKey } from "@/hooks/useClaimSecretKey";
import { useAutoConnect } from "./AutoConnectProvider";
import { myTransactionSubmitter } from "@/utils/transactionSubmitter";
import { useTransactionSubmitter } from "./TransactionSubmitterProvider";
import { toast } from "sonner";
import { APTOS_NETWORK } from "@/data/constant";


let dappImageURI: string | undefined;
if (typeof window !== "undefined") {
  dappImageURI = `${window.location.origin}${window.location.pathname}favicon.ico`;
}

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const { autoConnect } = useAutoConnect();
  const { useCustomSubmitter } = useTransactionSubmitter();

  // Enables claim flow when the `claim` query param is detected
  const claimSecretKey = useClaimSecretKey();

  const dappConfig: DappConfig = {
    network: APTOS_NETWORK,
    // aptosApiKeys: {
    //   testnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_TESNET,
    //   devnet: process.env.NEXT_PUBLIC_APTOS_API_KEY_DEVNET,
    // },
    aptosConnect: {
      claimSecretKey,
      dappId: "57fa42a9-29c6-4f1e-939c-4eefa36d9ff5",
      dappImageURI,
    },
    mizuwallet: {
      manifestURL:
        "https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json",
    },
    transactionSubmitter: useCustomSubmitter ? myTransactionSubmitter : undefined,
  };

  return (
    <AptosWalletAdapterProvider
      key={useCustomSubmitter ? "custom" : "default"}
      autoConnect={autoConnect}
      dappConfig={dappConfig}
      onError={(error) => {
        toast.error(error || "Unknown wallet error");
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};