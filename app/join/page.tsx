"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractService } from "@/services/contract";
import { ArrowRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";


export default function JoinPage() {
    const searchParams = useSearchParams();
    const role = searchParams.get("role") || "opponent";
    const [circleId, setCircleId] = useState<number>(0);
    const router = useRouter();

    const handleJoin = async () => {
        if (circleId > -1) {
            const contractService = new ContractService();
            const circle = await contractService.getCircleById(circleId);
            if (circle) {
                const circleDescription = circle.description;
                if (role === "opponent") {
                    router.push(`/create/challenge/details?challenge=${circleDescription}&join=opponent`);
                } else {
                    router.push(`/create/challenge/details?challenge=${circleDescription}&join=supporter`);
                }
            } else {
                toast.error("Circle not found");
            }
        } else {
            toast.error("Please enter a valid circle ID");
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <h1 className="text-2xl font-bold w-full text-center">Join Circle as a {role?.charAt(0).toUpperCase() + role?.slice(1)}</h1>
                <div className="flex flex-col gap-4 w-full mt-8">
                    <Input type="number" placeholder="Enter Circle ID" value={circleId} onChange={(e) => setCircleId(Number(e.target.value))} className="w-full h-14" />
                    <Button onClick={handleJoin} className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full mt-5">
                        Join <ArrowRightIcon className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </>
    )
}

