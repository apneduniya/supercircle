/* eslint-disable @typescript-eslint/no-unused-vars */
import { AIJudgeServer } from "@/server/judge";
import { ContractService } from "@/services/contract";
import { isDeadlinePassed } from "@/utils/timestamp";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    const contractService = new ContractService();

    const allLiveChallenges = await contractService.getAllCircles();

    const judgeableChallenges = allLiveChallenges.filter(challenge => !challenge.resolved && isDeadlinePassed(challenge.deadline));

    const judgeServer = new AIJudgeServer();

    try {
        for (const challenge of judgeableChallenges) {
            await judgeServer.judge(challenge);
        }

        return NextResponse.json({
            message: "Judged all challenges",
            success: true,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: "Error judging challenges",
            success: false,
        }, { status: 500 });
    }
}


