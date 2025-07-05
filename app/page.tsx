import WalletDetailsCard from "@/components/cards/wallet-details";
import LiveChallenges from "@/components/sections/live-challenges";


export default function Home() {
  return (
    <>
      <section className="flex flex-col justify-start h-full w-full">
        <WalletDetailsCard />
        <LiveChallenges />
      </section>
    </>
  );
}


