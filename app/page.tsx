import WalletDetailsCard from "@/components/cards/wallet-details";
import LiveChallenges from "@/components/sections/live-challenges";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function Home() {
  return (
    <>
      <section className="flex flex-col justify-start h-full w-full">
        <WalletDetailsCard />

        <div className="flex flex-col justify-center w-full mt-10 gap-4">
          <Link href="/join">
            <Button variant="outline" className="text-[var(--supercircle-red)] border-[var(--supercircle-red)] py-7 font-bold rounded-md w-full">
              Join Challenge
            </Button>
          </Link>
          <Link href="/create">
            <Button className="bg-[var(--supercircle-red)] text-white py-7 font-bold rounded-md w-full">
              Create Challenge
            </Button>
          </Link>
        </div>

        <LiveChallenges />
      </section>
    </>
  );
}


