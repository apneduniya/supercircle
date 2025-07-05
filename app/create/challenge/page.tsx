"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";



export default function ChallengePage() {
    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge");
    const [reward, setReward] = useState<string>("");
    const router = useRouter();

    const handleNext = () => {
        if (reward.length > 0 && Number(reward) > 0) {
            router.push(`/create/challenge/details?challenge=${challenge}&reward=${reward}`);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <h1 className="text-2xl font-bold w-full text-center">What is the reward (prize) amount?</h1>
                <div className="flex flex-col gap-4 w-full mt-8">
                    <div className="flex gap-2 w-full items-center">
                        <Input type="number" placeholder="0" value={reward} onChange={(e) => setReward(e.target.value)} className="w-full h-14 border-none text-4xl placeholder:text-4xl text-center shadow-none" />
                        <p className="text-4xl text-gray-500 font-bold">APT</p>
                    </div>
                    <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5" onClick={handleNext}>
                        Generate Challenge ID
                    </Button>
                </div>
            </div>
        </>
    )
}
