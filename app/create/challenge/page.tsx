"use client";

// import { ContractService } from "@/services/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
// import { useWallet } from "@aptos-labs/wallet-adapter-react";
// import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
// import { APTOS_NETWORK } from "@/data/constant";
// import { toast } from "sonner";
import { ArrowRightIcon } from "lucide-react";

function ChallengeContent() {
    // const { account, signAndSubmitTransaction } = useWallet();
    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge") || "";
    const [reward, setReward] = useState<string>("");
    const router = useRouter();

    // const contractService = new ContractService();
    // const aptos = new Aptos(new AptosConfig({
    //     network: APTOS_NETWORK,
    // }));

    // const handleNext = async () => {
    //     if (reward.length > 0 && Number(reward) > 0 && account) {
    //         // router.push(`/create/challenge/details?challenge=${challenge}&reward=${reward}`);

    //         const deadline = Math.floor(Date.now() / 1000) + 30; // 30 seconds from now

    //         const transaction = contractService.createCircleTransaction(
    //             challenge,
    //             deadline,
    //             0,
    //             Number(reward)
    //         );

    //         try {
    //             // sign and submit transaction
    //             const signedTransaction = await signAndSubmitTransaction(transaction);
    //             // wait for transaction to be committed
    //             await aptos.waitForTransaction({
    //                 transactionHash: signedTransaction.hash,
    //             });
    //             console.log(signedTransaction);

    //             toast.success("Transaction signed and submitted successfully");
    //         } catch (error) {
    //             toast.error("Failed to sign and submit transaction");
    //             console.error(error);
    //         }
    //     } else {
    //         toast.error("Please enter a valid reward amount");
    //     }
    // }

    const handleNext = () => {
        if (reward.length > 0 && Number(reward) > 0) {
            router.push(`/create/challenge/add-more-details?challenge=${challenge}&reward=${reward}`);
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-bold w-full text-center">What is the reward (prize) amount?</h1>
            <div className="flex flex-col gap-4 w-full mt-8">
                <div className="flex gap-2 w-full items-center">
                    <Input type="number" placeholder="0" value={reward} onChange={(e) => setReward(e.target.value)} className="w-full h-14 border-none text-4xl placeholder:text-4xl text-center shadow-none" />
                    <p className="text-4xl text-gray-500 font-bold">APT</p>
                </div>
                <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5" onClick={handleNext}>
                    Last Step <ArrowRightIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default function ChallengePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChallengeContent />
        </Suspense>
    );
}
