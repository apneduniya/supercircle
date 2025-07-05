"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";


export default function ChallengeDetailsPage() {
    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge");
    const challengeID = "abcd1234";
    const reward = searchParams.get("reward");

    const handleCopy = () => {
        navigator.clipboard.writeText(challengeID);
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
                <div className="flex flex-col gap-4 w-full mt-8">
                    <div className="flex gap-2 w-full items-center">
                        <Input type="text" placeholder="Generating Challenge ID..." value={challengeID} className="w-full h-14 text-4xl placeholder:text-4xl text-center" disabled />
                    </div>
                    <Button onClick={handleCopy} className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5">
                        Copy Challenge ID
                    </Button>
                </div>
            </div>
        </>
    )
}

