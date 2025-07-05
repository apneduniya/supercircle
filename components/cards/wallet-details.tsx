"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WalletService } from "@/services/wallet";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";



export default function WalletDetailsCard() {
    const { account } = useWallet();
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        if (!account) return;

        const walletService = new WalletService(account.address.toString());
        let isMounted = true;

        const fetchBalance = async () => {
            try {
                const balance = await walletService.getBalance();
                if (isMounted) setBalance(balance);
            } catch (error) {
                console.error(error);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // 10 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [account]);

    return (
        <>
            <div>
                <Card>
                    <CardHeader>
                        <span className="text-sm text-gray-500">
                            YOUR BALANCE
                        </span>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-2xl font-bold">
                            {balance.toString()}.00 APT
                        </h1>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}


