"use client";

import Link from "next/link"
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function BottomNavbar() {
  const pathname = usePathname();

  const [isHomePage, setIsHomePage] = useState(false);
  const [isCreatePage, setIsCreatePage] = useState(false);
  const [isSettingsPage, setIsSettingsPage] = useState(false);

  useEffect(() => {
    setIsHomePage(pathname === "/");
    setIsCreatePage(pathname === "/create");
    setIsSettingsPage(pathname === "/settings");
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 w-full items-center justify-around shadow-t bg-[var(--background)]">
      <Link
        href="/"
        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
          isHomePage 
            ? "text-[var(--supercircle-red)]" 
            : "text-gray-500 hover:text-[var(--supercircle-red)] focus:text-[var(--supercircle-red)] dark:text-gray-400 dark:hover:text-gray-50 dark:focus:text-gray-50"
        }`}
        prefetch={false}
      >
        <HomeIcon className="h-6 w-6" />
        <span className="text-xs">Home</span>
      </Link>
      <Link
        href="/create"
        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
          isCreatePage 
            ? "text-[var(--supercircle-red)]" 
            : "text-gray-500 hover:text-[var(--supercircle-red)] focus:text-[var(--supercircle-red)] dark:text-gray-400 dark:hover:text-gray-50 dark:focus:text-gray-50"
        }`}
        prefetch={false}
      >
        <PlusIcon className="h-6 w-6" />
        <span className="text-xs">Create</span>
      </Link>   
      <Link
        href="/settings"
        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
          isSettingsPage 
            ? "text-[var(--supercircle-red)]" 
            : "text-gray-500 hover:text-[var(--supercircle-red)] focus:text-[var(--supercircle-red)] dark:text-gray-400 dark:hover:text-gray-50 dark:focus:text-gray-50"
        }`}
        prefetch={false}
      >
        <SettingsIcon className="h-6 w-6" />
        <span className="text-xs">Settings</span>
      </Link>
    </nav>
  )
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}


function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}


function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
