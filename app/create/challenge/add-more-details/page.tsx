"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import * as React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "@/data/constant";
import { toast } from "sonner";
import { ContractService } from "@/services/contract";
import { useRouter } from "next/navigation";


export default function AddMoreDetailsPage() {
    const { account, signAndSubmitTransaction } = useWallet();
    const router = useRouter();
    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge");
    const reward = searchParams.get("reward");

    // deadline
    const presetDeadlines = [
        { label: "30s", value: 30 },
        { label: "1m", value: 60 },
        { label: "5m", value: 300 },
    ];
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // supporter feature
    const [isSupporterFeature, setIsSupporterFeature] = useState<boolean>(false);
    const [supporterPercentage, setSupporterPercentage] = useState<number>(0);

    const contractService = new ContractService();
    const aptos = new Aptos(new AptosConfig({
        network: APTOS_NETWORK,
    }));

    function calculateDeadline(): number {
        if (selectedPreset !== null) {
            // Preset selected: deadline is now + preset seconds
            return Math.floor(Date.now() / 1000) + selectedPreset;
        } else {
            // Custom date/time
            const [h, m, s] = time.split(":").map(Number);
            const customDate = new Date(date || new Date());
            customDate.setHours(h || 0, m || 0, s || 0, 0);
            return Math.floor(customDate.getTime() / 1000);
        }
    }

    const handleSignTransaction = async () => {
        if (reward && reward.length > 0 && Number(reward) > 0 && ((date && time) || selectedPreset !== null)) {
            if (!account) {
                toast.error("Please connect your wallet");
                return;
            }
            if (isSupporterFeature && supporterPercentage <= 0) {
                toast.error("Please enter a valid supporter percentage");
                return;
            }

            const deadline = calculateDeadline();

            const transaction = contractService.createCircleTransaction(
                challenge || "",
                deadline || 0,
                isSupporterFeature ? supporterPercentage : 0,
                Number(reward)
            );

            try {
                // sign and submit transaction
                const signedTransaction = await signAndSubmitTransaction(transaction);
                // wait for transaction to be committed
                await aptos.waitForTransaction({
                    transactionHash: signedTransaction.hash,
                });
                console.log(signedTransaction);

                toast.success("Transaction signed and submitted successfully");

                router.push(`/create/challenge/details?challenge=${challenge}`);
            } catch (error) {
                toast.error("Failed to sign and submit transaction");
                console.error(error);
            }
        } else {
            toast.error("Please enter a valid reward amount or deadline");
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <h1 className="text-sm w-full text-center">Prize Amount</h1>
                <h1 className="text-6xl font-bold w-full text-center mb-10">
                    {reward} APT
                </h1>
                <p className="text-lg font-bold w-full text-center">
                    {challenge}
                </p>
                <Card className="mt-5 w-full">
                    <CardContent>
                        <div className="flex flex-col gap-5 w-full">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-lg font-bold">Deadline</h1>
                                <div className="flex gap-2 mb-2 justify-around">
                                    {presetDeadlines.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPreset(preset.value);
                                                setDate(undefined);
                                                setTime("");
                                            }}
                                            className={`text-sm p-4 rounded-md w-fit border transition-colors ${selectedPreset === preset.value ? "border-red-500 bg-red-100 text-red-700" : "bg-gray-100 text-gray-500 border-transparent"}`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4 items-center justify-around">
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="date"
                                            placeholder="Select date"
                                            value={date && !selectedPreset ? date.toISOString().slice(0, 10) : ""}
                                            onChange={(e) => {
                                                setDate(e.target.value ? new Date(e.target.value) : undefined);
                                                setSelectedPreset(null);
                                            }}
                                            className={selectedPreset === null && date ? "border-red-500 bg-red-100 text-red-700" : ""}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Input
                                            type="time"
                                            id="time-picker"
                                            step="1"
                                            value={time && !selectedPreset ? time : ""}
                                            onChange={(e) => {
                                                setTime(e.target.value);
                                                setSelectedPreset(null);
                                            }}
                                            className={selectedPreset === null && time ? "border-red-500 bg-red-100 text-red-700" : ""}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center justify-between">
                                <h1 className="text-lg font-bold">Enable Supporter</h1>
                                <Switch checked={isSupporterFeature} onCheckedChange={setIsSupporterFeature} />
                            </div>
                            {
                                isSupporterFeature && (
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-lg font-bold">Supporter Percentage</h1>
                                        <div className="flex gap-2 items-center justify-between">
                                            <Input type="number" value={supporterPercentage} onChange={(e) => setSupporterPercentage(Number(e.target.value))} />
                                            <p className="text-lg font-bold">%</p>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </CardContent>
                    <CardFooter className="mt-5">
                        <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full" onClick={handleSignTransaction}>
                            Sign the transaction
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}
