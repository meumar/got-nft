"use client";
import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useWallet } from "@solana/wallet-adapter-react";

import { useConnection } from "@solana/wallet-adapter-react";

import { fetchAllDigitalAssetByOwner } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, publicKey, percentAmount } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';

import { PublicKey, clusterApiUrl } from "@solana/web3.js";


import LoadingComponent from "./Loading";
import { downloadFile, prepareDragons } from "../../../utils";
import DragonCard from "./UI/dragonCard";

const MyDragons: NextPage = () => {
  const [allDragons, setAllDragons] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { connection } = useConnection();
  const { publicKey }: any = useWallet();
  const wallet = useWallet();

  const umi = createUmi(clusterApiUrl('devnet')).use(walletAdapterIdentity(wallet)).use(mplTokenMetadata()).use(mplCandyMachine());

  useEffect(() => {
    fetchAllWallets();
  }, [publicKey]);

  const fetchAllWallets = async () => {
    if (publicKey) {
      setLoading(true);
      const assets: any = await fetchAllDigitalAssetByOwner(umi, publicKey);
      const result = await prepareDragons(assets);
      setAllDragons(result.map((e: any) => {
        e.owner = publicKey.toBase58();
        e.sell = false;
        return e
      }));
      setLoading(false);
    } else {
      setAllDragons([]);
    }
  };
  return (
    <div>
      {loading ? (
        <LoadingComponent />
      ) : (
        <>
          {!allDragons.length && (
            <div className="text-center">
              <h2>{"You don't have any NFTs"}</h2>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allDragons.map((acc: any, index: any) => {
              return (
                <div key={acc.wallet_address + "_" + index}>
                  <DragonCard {...acc} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MyDragons;
