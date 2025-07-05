import Image from "next/image";
import basicInfo from "@/data/basic.json";
import { WalletSelector } from "../aptos/WalletSelector";
import Link from "next/link";


export default function Header() {
    return (
        <>
            <header className="fixed top-0 z-50 w-full max-w-[500px] px-4 py-2 backdrop-blur-sm bg-[var(--background)]">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <Image src={basicInfo.logo} alt="logo" width={60} height={60} />
                    </Link>
                    <WalletSelector />
                </div>
            </header>
        </>
    )
}


