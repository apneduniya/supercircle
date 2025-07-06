import WalletDetailsCard from "@/components/cards/wallet-details";
import LiveChallenges from "@/components/sections/live-challenges";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";


export default function Home() {
  return (
    <>
      <section className="flex flex-col justify-start h-full w-full">
        <WalletDetailsCard />

        <div className="flex flex-col justify-center w-full mt-10 gap-4">
          <Link href="/join?role=opponent">
            <Button variant="outline" className="text-[var(--supercircle-red)] border-[var(--supercircle-red)] py-7 font-bold rounded-md w-full">
              Join Circle as an Opponent
            </Button>
          </Link>
          <Link href="/join?role=supporter">
            <Button variant="outline" className="text-[var(--supercircle-red)] border-[var(--supercircle-red)] py-7 font-bold rounded-md w-full">
              Join Circle as a Supporter
            </Button>
          </Link>
          <div className="w-full flex justify-center">
            <Separator className="w-1! h-1! rounded-4xl" />
          </div>
          <Link href="/create">
            <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full">
              Create Circle
            </Button>
          </Link>
          <Separator />
        </div>

        <LiveChallenges />
      </section>
    </>
  );
}


