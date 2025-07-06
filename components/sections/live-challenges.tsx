/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Circle, ContractService } from "@/services/contract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { timeStampToDateTime, isDeadlinePassed } from "@/utils/timestamp";
import { Alert, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";


// Challenge Card Component
interface ChallengeCardProps {
    challenge: Circle;
    isLive?: boolean;
}

export function ChallengeCard({ challenge, isLive = false }: ChallengeCardProps) {
    const cardClassName = !isLive
        ? "bg-gray-100 opacity-50 cursor-not-allowed select-none mb-4"
        : "bg-gray-50 mb-4";

    return (
        <Card key={challenge.id} className={`${cardClassName} w-full`}>
            <CardHeader>
                <CardTitle>{challenge.description.length > 40 ? challenge.description.slice(0, 40) + "..." : challenge.description}</CardTitle>
                <CardDescription>{timeStampToDateTime(challenge.deadline)}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <p>Creator: {challenge.creator.slice(0, 6)}...{challenge.creator.slice(-4)}</p>
                    <p>Opponent: {challenge.opponent ? challenge.opponent?.slice(0, 6) + "..." + challenge.opponent?.slice(-4) : "Yet to join"}</p>
                    <p>Creator Supporter Pct: {challenge.creator_supporter_pct}</p>
                    <p>Opponent Supporter Pct: {challenge.opponent_supporter_pct}</p>
                    <p>Total no. of Creator Supporters: {challenge.creator_supporters.length}</p>
                    <p>Total no. of Opponent Supporters: {challenge.opponent_supporters.length}</p>
                    <p>Status: {challenge.status}</p>
                    <p>Resolved: {challenge.resolved ? "Yes" : "No"}</p>
                    {
                        challenge.resolved && (
                            <p>Winner: {challenge.winner?.slice(0, 6)}...{challenge.winner?.slice(-4)}</p>
                        )
                    }
                    <p>Prize Pool: {challenge.prize_pool}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function LiveChallenges() {
    const [liveChallenges, setLiveChallenges] = useState<Circle[]>([]);
    const [pastChallenges, setPastChallenges] = useState<Circle[]>([]);

    const contractService = new ContractService();

    useEffect(() => {
        const fetchChallenges = async () => {
            const challenges = await contractService.getAllCircles();
            setLiveChallenges(challenges.filter(challenge => !challenge.resolved && !isDeadlinePassed(challenge.deadline)));
            setPastChallenges(challenges.filter(challenge => challenge.resolved || isDeadlinePassed(challenge.deadline)));
        }

        fetchChallenges();
    }, []);

    return (
        <section id="live-challenges" className="h-full w-full mt-5">
            {/* Live Challenges Section */}
            {
                liveChallenges.length > 0 && (
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-3">
                            Live Challenges
                        </h1>
                        {liveChallenges.map((challenge) => (
                            <Link href={`/create/challenge/details?challenge=${challenge.description}`} key={challenge.id}>
                                <ChallengeCard key={challenge.id} challenge={challenge} isLive={true} />
                            </Link>
                        ))}
                    </div>
                )
            }

            {/* No Challenges Message */}
            {
                liveChallenges.length === 0 && (
                    <div className={`flex flex-col justify-center items-center h-full w-full ${liveChallenges.length > 0 ? "mt-20" : "mt-5 mb-10"}`}>
                        <Alert variant="default" className="flex flex-row items-center gap-4">
                            <AlertCircleIcon className="w-4 h-4" />
                            <AlertTitle>No live challenges at the moment</AlertTitle>
                        </Alert>
                    </div>
                )
            }

            {/* Past Challenges Section */}
            {
                pastChallenges.length > 0 && (
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-3">
                            Past Challenges
                        </h1>
                        {pastChallenges.map((challenge) => (
                            <Link href={`/create/challenge/details?challenge=${challenge.description}`} key={challenge.id}>
                                <ChallengeCard key={challenge.id} challenge={challenge} isLive={false} />
                            </Link>
                        ))}
                    </div>
                )
            }
        </section>
    )
}
