/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ContractService, Circle, Supporter } from "@/services/contract";
import { toast } from "sonner";


export default function ChallengeDetailsPage() {
    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge")?.toLowerCase() || "";
    const contractService = new ContractService();

    const [circle, setCircle] = useState<Circle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            setLoading(true);
            setError(null);
            try {
                const found = await contractService.findCircleByDescription(challenge);
                setCircle(found);
                if (!found) setError("Challenge not found");
            } catch {
                setError("Error fetching challenge details");
            } finally {
                setLoading(false);
            }
        }
        if (challenge) fetchDetails();
    }, [challenge]);

    const handleCircleIdCopy = () => {
        if (circle) {
            navigator.clipboard.writeText(circle.id.toString());
            toast.success("Circle ID copied to clipboard");
        };
    };

    const formatSupporter = (s: Supporter, i: number) => (
        <div key={i} className="flex flex-col border rounded p-2 mb-2">
            <span className="text-xs text-gray-500">Address: <span className="font-mono break-all">{s.addr}</span></span>
            <span>Amount: <b>{s.amount} APT</b></span>
            <span className="text-xs text-gray-500">Joined: {contractService.formatTimestamp(s.joined_at)}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-2">Challenge Details</h1>
            {loading && <div className="text-center py-10">Loading...</div>}
            {error && <div className="text-center text-red-500 py-10">{error}</div>}
            {circle && (
                <>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-gray-500">Circle ID</span>
                        <span className="text-4xl font-bold">{circle.id}</span>
                        <Button onClick={handleCircleIdCopy} className="bg-[var(--supercircle-red)] text-white py-2 px-4 font-bold rounded mt-2">Copy Circle ID</Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-6 border rounded p-2 w-full">
                        <div><b>Description:</b> {circle.description}</div>
                        <div><b>Status:</b> {contractService.getStatusString(circle.status)} {circle.resolved && <span className="ml-2 text-green-600">(Resolved)</span>}</div>
                        <div><b>Created At:</b> {contractService.formatTimestamp(circle.created_at)} ({contractService.getTimeAgo(circle.created_at)})</div>
                        <div><b>Deadline:</b> {contractService.formatTimestamp(circle.deadline)} ({contractService.futureTimeString(circle.deadline)})</div>
                        <div><b>Prize Pool:</b> {circle.prize_pool} APT</div>
                        <div><b>Creator:</b> <span className="font-mono break-all">{circle.creator}</span></div>
                        <div><b>Opponent:</b> {circle.opponent ? <span className="font-mono break-all">{circle.opponent}</span> : <span className="italic text-gray-400">Yet to join</span>}</div>
                        <div><b>Creator Stake:</b> {circle.creator_stake} APT</div>
                        <div><b>Opponent Stake:</b> {circle.opponent_stake} APT</div>
                        <div><b>Creator Supporter:</b> {circle.creator_supporter_pct}%</div>
                        <div><b>Opponent Supporter:</b> {circle.opponent_supporter_pct}%</div>
                    </div>
                    <div className="mt-6">
                        <h2 className="text-lg font-bold mb-2">Creator Supporters ({circle.creator_supporters.length})</h2>
                        {circle.creator_supporters.length === 0 && <div className="text-gray-400 italic">No supporters yet</div>}
                        {circle.creator_supporters.map(formatSupporter)}
                    </div>
                    <div className="mt-6">
                        <h2 className="text-lg font-bold mb-2">Opponent Supporters ({circle.opponent_supporters.length})</h2>
                        {circle.opponent_supporters.length === 0 && <div className="text-gray-400 italic">No supporters yet</div>}
                        {circle.opponent_supporters.map(formatSupporter)}
                    </div>
                </>
            )}
        </div>
    );
}

