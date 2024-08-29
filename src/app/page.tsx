"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import "./globals.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const { publicKey } = useWallet();
  const router = useRouter();
  return (
    <main
      className="relative flex h-screen flex-col items-center justify-center p-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url("/bg.jpg")' }}></div>
      <div className="relative flex flex-col items-center justify-center p-10 bg-opacity-50">
        <div className="relative z-10 text-center max-w-full md:max-w-5xl px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
            Welcome to the world of GOT
          </h1>
          <p className="text-base sm:text-lg md:text-lg text-white mb-4">
            Explore exclusive digital treasures from the legendary world of Game of thrones. Discover, collect, and trade unique NFTs featuring your
            favorite characters and iconic moments.
          </p>
          <button
            className="bg-gray-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-md hover:bg-gray-800 transition-colors duration-300"
            onClick={() => router.push("/marketplace")}
          >
            Start Your Adventure
          </button>
        </div>
      </div>
    </main>
  );
}
