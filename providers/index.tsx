import { AutoConnectProvider } from "@/providers/AutoConnectProvider";
import { ReactQueryClientProvider } from "@/providers/ReactQueryClientProvider";
import { TransactionSubmitterProvider } from "./TransactionSubmitterProvider";
import { WalletProvider } from "./WalletProvider";


export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AutoConnectProvider>
                <ReactQueryClientProvider>
                    <TransactionSubmitterProvider>
                        <WalletProvider>
                            {children}
                        </WalletProvider>
                    </TransactionSubmitterProvider>
                </ReactQueryClientProvider>
            </AutoConnectProvider>
        </>
    )
}


