/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ContractService, Circle, Supporter } from "@/services/contract";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "@/data/constant";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function ChallengeDetailsContent() {
    const { account, signAndSubmitTransaction } = useWallet();
    const router = useRouter();

    const searchParams = useSearchParams();
    const challenge = searchParams.get("challenge")?.toLowerCase() || "";
    const join = searchParams.get("join") || "";
    const contractService = new ContractService();

    const [isJoinAsOpponent, setIsJoinAsOpponent] = useState<boolean>(false);
    const [isOpponentSupporterFeature, setIsOpponentSupporterFeature] = useState<boolean>(false);
    const [opponentSupporterPct, setOpponentSupporterPct] = useState<number>(0);

    const [isJoinAsSupporter, setIsJoinAsSupporter] = useState<boolean>(false);
    const [supporterSide, setSupporterSide] = useState<"creator" | "opponent">("creator");
    const [supportAmount, setSupportAmount] = useState<number>(0);
    const [maxCreatorSupportAmount, setMaxCreatorSupportAmount] = useState<number>(0);
    const [maxOpponentSupportAmount, setMaxOpponentSupportAmount] = useState<number>(0);

    const aptos = new Aptos(new AptosConfig({
        network: APTOS_NETWORK,
    }));

    const [circle, setCircle] = useState<Circle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            setLoading(true);
            setError(null);
            try {
                console.log("Fetching details for challenge:", challenge);
                const found = await contractService.findCircleByDescription(challenge);
                console.log("Found circle data:", found);
                setCircle(found);
                if (!found) setError("Challenge not found");
            } catch (error) {
                console.error("Error fetching challenge details:", error);
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
            <span className="text-xs text-gray-500">Joined: {contractService.formatTimestamp(s.joined_at)} ({contractService.getTimeAgo(s.joined_at)})</span>
        </div>
    );

    const handleJoinAsOpponent = async () => {
        if (!circle) {
            toast.error("Challenge not found");
            return;
        }
        if (!account) {
            toast.error("Please connect your wallet");
            return;
        }
        if (circle?.opponent) {
            toast.error("There is already an opponent");
            return;
        }
        if (circle?.creator === account.address?.toString()) {
            toast.error("You cannot join as an opponent to your own challenge");
            return;
        }
        if (isOpponentSupporterFeature) {
            if (opponentSupporterPct <= 0) {
                toast.error("Please enter a valid supporter percentage");
                return;
            }
        }

        // Validate circle ID
        if (isNaN(Number(circle.id)) || Number(circle.id) < -1) {
            toast.error("Invalid circle ID");
            console.log(isNaN(Number(circle.id)), Number(circle.id) < -1);
            console.error("Invalid circle ID:", circle.id);
            return;
        }

        try {
            const circleId = Number(circle.id);
            console.log("Using circle ID:", circleId);
            
            const transaction = contractService.acceptCircleTransaction(circleId, isOpponentSupporterFeature ? opponentSupporterPct : 0);
            const signedTransaction = await signAndSubmitTransaction(transaction);
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
    };

    const handleJoinAsSupporter = async () => {
        if (!circle) {
            toast.error("Challenge not found");
            return;
        }
        if (!account) {
            toast.error("Please connect your wallet");
            return;
        }
        if (circle?.creator === account.address?.toString()) {
            toast.error("You cannot join as a supporter to your own challenge");
            return;
        }
        if (circle?.opponent === account.address?.toString()) {
            toast.error("You cannot join as a supporter to your own challenge");
            return;
        }

        // Validate circle ID
        if (isNaN(Number(circle.id)) || Number(circle.id) < -1) {
            toast.error("Invalid circle ID");
            console.log(isNaN(Number(circle.id)), Number(circle.id) < -1);
            console.error("Invalid circle ID:", circle.id);
            return;
        }

        if (supportAmount <= 0) {
            toast.error("Please enter a valid support amount");
            return;
        }

        if (supporterSide === "creator") {
            if (supportAmount > maxCreatorSupportAmount) {
                toast.error("Support amount exceeds the maximum allowed");
                return;
            }
        } else {
            if (supportAmount > maxOpponentSupportAmount) {
                toast.error("Support amount exceeds the maximum allowed");
                return;
            }
        }

        try {
            const circleId = Number(circle.id);
            console.log("Using circle ID:", circleId);
            
            const transaction = contractService.joinAsSupporterTransaction(circleId, supporterSide === "creator" ? 0 : 1, supportAmount);
            const signedTransaction = await signAndSubmitTransaction(transaction);
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
    }

    useEffect(() => {

        if (circle && join === "supporter") {
            if (!account) {
                toast.warning("Please connect your wallet");
            }
            if (circle?.creator === account?.address?.toString()) {
                toast.error("You cannot join as a supporter to your own challenge");
                return;
            }
            if (circle?.opponent === account?.address?.toString()) {
                toast.error("You cannot join as a supporter to your own challenge");
                return;
            }

            setIsJoinAsSupporter(true);

            // remaining supporter stake calculations

            const maxCreatorSupportAmount = circle.prize_pool * (circle.creator_supporter_pct / 100);
            const maxOpponentSupportAmount = circle.prize_pool * (circle.opponent_supporter_pct / 100);

            const totalStakeOfCreatorSupporters = circle.creator_supporters.reduce((acc, s) => acc + s.amount, 0);
            const totalStakeOfOpponentSupporters = circle.opponent_supporters.reduce((acc, s) => acc + s.amount, 0);

            const remainingStakeOfCreator = maxCreatorSupportAmount - totalStakeOfCreatorSupporters;
            const remainingStakeOfOpponent = maxOpponentSupportAmount - totalStakeOfOpponentSupporters;

            setMaxCreatorSupportAmount(remainingStakeOfCreator);
            setMaxOpponentSupportAmount(remainingStakeOfOpponent);
        }
    }, [circle, account, join]);

    useEffect(() => {
        if (join === "opponent") {
            setIsJoinAsOpponent(true);
            if (!account) {
                toast.warning("Please connect your wallet");
            }
        }
    }, [join]);

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
                        <Button onClick={handleCircleIdCopy} className="bg-[var(--supercircle-red)] text-white py-7 px-4 font-bold rounded-lg mt-2 w-full">Copy Circle ID</Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-6 border rounded p-2 w-full">
                        <div><b>Description:</b> {circle.description}</div>
                        <div><b>Status:</b> {contractService.getStatusString(circle.status)} {circle.resolved && <span className="ml-2 text-green-600">(Resolved)</span>}</div>
                        <div><b>Created At:</b> {contractService.formatTimestamp(circle.created_at)} ({contractService.getTimeAgo(circle.created_at)})</div>
                        <div><b>Deadline:</b> {contractService.formatTimestamp(circle.deadline)} ({contractService.futureTimeString(circle.deadline)})</div>
                        <div><b>Prize Pool:</b> {circle.prize_pool} APT</div>
                        <div><b>Creator:</b> <span className={`font-mono break-all ${circle.resolved && circle.winner === circle.creator ? "text-green-600" : "text-red-600"}`}>{circle.creator}</span></div>
                        <div><b>Opponent:</b> {circle.opponent ? <span className={`font-mono break-all ${circle.resolved && circle.winner === circle.opponent ? "text-green-600" : "text-red-600"}`}>{circle.opponent}</span> : <span className="italic text-gray-400">Yet to join</span>}</div>
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
            <Separator />
            {isJoinAsOpponent && (
                <div className="mt-6">
                    <h2 className="text-2xl font-bold mb-5">Join as Opponent</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 items-center justify-between">
                            <h1 className="text-lg font-bold">Enable Supporter</h1>
                            <Switch checked={isOpponentSupporterFeature} onCheckedChange={setIsOpponentSupporterFeature} />
                        </div>
                        {
                            isOpponentSupporterFeature && (
                                <div className="flex gap-2 items-center justify-between">
                                    <span className="text-sm text-gray-500">Supporter Percentage</span>
                                    <Input type="number" value={opponentSupporterPct} onChange={(e) => setOpponentSupporterPct(Number(e.target.value))} className="w-full" />
                                </div>
                            )
                        }
                        <Button onClick={handleJoinAsOpponent} className="bg-[var(--supercircle-red)] text-white py-7 px-4 font-bold rounded mt-7 w-full">Sign the transaction</Button>
                    </div>
                </div>
            )}
            {isJoinAsSupporter && (
                <div className="mt-6">
                    <h2 className="text-2xl font-bold mb-3">Join as Supporter</h2>
                    <p className="text-sm text-gray-500 mb-7">
                        You can join as a supporter to either the creator or the opponent. Max support amount is {supporterSide === "creator" ? maxCreatorSupportAmount : maxOpponentSupportAmount} APT.
                    </p>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 items-center justify-between">
                            <span className="text-sm text-gray-500">Support Amount</span>
                            <Input type="number" value={supportAmount} onChange={(e) => setSupportAmount(Number(e.target.value))} className="w-full" />
                        </div>
                        <div className="flex gap-2 items-center justify-between">
                            <span className="text-sm text-gray-500">Support Side</span>
                            <Select value={supporterSide} onValueChange={(value) => setSupporterSide(value as "creator" | "opponent")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a side" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="creator">Creator</SelectItem>
                                    <SelectItem value="opponent">Opponent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleJoinAsSupporter} className="bg-[var(--supercircle-red)] text-white py-7 px-4 font-bold rounded mt-7 w-full">Sign the transaction</Button>
                </div>
            )}
        </div>
    );
}

export default function ChallengeDetailsPage() {
    return (
        <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
            <ChallengeDetailsContent />
        </Suspense>
    );
}

