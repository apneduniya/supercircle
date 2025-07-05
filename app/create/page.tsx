"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function CreatePage() {
    const [challenge, setChallenge] = useState<string>("");
    const router = useRouter();

    const handleNext = () => {
        if (challenge.length > 0) {
            router.push(`/create/challenge?challenge=${challenge}`);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <h1 className="text-2xl font-bold w-full text-center">What is the challenge?</h1>
                <div className="flex flex-col gap-4 w-full mt-8">
                    <Input type="text" placeholder="Type your challenge here..." value={challenge} onChange={(e) => setChallenge(e.target.value)} className="w-full h-14" />
                    <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5" onClick={handleNext}>
                        Next <ArrowRightIcon className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </>
    )
}


