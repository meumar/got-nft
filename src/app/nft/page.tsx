"use client";

import MyDragons from "../components/MyDragons";
import { useWallet } from "@solana/wallet-adapter-react";

const DragonPage = () => {
    const { publicKey } = useWallet();




    return <div className="flex flex-col gap-5 text-center p-10">
        <div className="relative flex flex-col items-center justify-center p-10 bg-opacity-50">
            {
                publicKey && <MyDragons />
            }
            <h1 className="text-lg text-white">
                {!publicKey && "Please connect your wallet to create or buy NFT"}
            </h1>
        </div>
    </div>
}

export default DragonPage