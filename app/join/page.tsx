"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinPage() {
    const [challengeId, setChallengeId] = useState<string>("");
    const router = useRouter();

    const handleJoin = () => {
        if (challengeId.length > 0) {
            router.push(`/join/${challengeId}`);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <h1 className="text-2xl font-bold w-full text-center">Join Challenge</h1>
                <div className="flex flex-col gap-4 w-full mt-8">
                    <Input type="text" placeholder="Enter Challenge ID" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="w-full h-14" />
                    <Button onClick={handleJoin} className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5">
                        Join <ArrowRightIcon className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </>
    )
}

