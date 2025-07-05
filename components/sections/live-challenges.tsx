"use client";

import { useEffect, useState } from "react";


export default function LiveChallenges() {
    const [challenges, setChallenges] = useState([]);

    useEffect(() => {
        const fetchChallenges = async () => {
            setChallenges([]);
        }

        fetchChallenges();
    }, []);
    return (
        <section id="live-challenges" className="h-full w-full">
            {
                challenges.length > 0 ? (
                    challenges.map((challenge) => (
                        <div key={challenge}>
                        </div>
                    ))
                ): (
                    <div className="flex flex-col justify-center items-center h-full w-full mt-20">
                        <h1>No live challenges at the moment</h1>
                    </div>
                )
            }
        </section>
    )
}


