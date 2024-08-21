import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";


import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { create } from '@metaplex-foundation/mpl-core-candy-machine'
import { generateSigner, publicKey, percentAmount } from '@metaplex-foundation/umi';

import { mplCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata'

import { PROGRAM_ID } from "../../../constants";
import { useProgram } from "./WalletContextProvider";

const HomeComponent: NextPage = () => {
  const [gamesLoading, setGamesLoading] = useState<boolean>(false);

  const { connection } = useConnection();

  const program = useProgram();
  const program_id = new PublicKey(PROGRAM_ID);

  const wallet = useWallet()
  // const umi = createUmi('https://api.devnet.solana.com');
  // umi.use(walletAdapterIdentity(wallet));

  const umi = createUmi('https://api.devnet.solana.com').use(walletAdapterIdentity(wallet)).use(mplTokenMetadata()).use(mplCandyMachine())
  const umiPublicKey = publicKey("CMACYFENjoBMHzapRXyo1JZkVS6EtaDDzkjMrmQLvr4J");

  // const { publicKey }: any = useWallet();

  useEffect(() => {
  }, []);

  const createInstruction = async () => {
    try {
      const mint = generateSigner(umi);
      console.log("USER", mint.publicKey, mint)
      console.log("00");
      await createNft(umi, {
        mint,
        name: 'My NFT',
        uri: 'https://raw.githubusercontent.com/meumar/my-files/main/ntf.json',
        sellerFeeBasisPoints: percentAmount(5.5),
      }).sendAndConfirm(umi);
      console.log("11");
      
      const asset = await fetchDigitalAsset(umi, mint.publicKey);

      console.log("asset", asset);
    } catch (e) {
      console.log("Error", e)
    }
  }

  return (
    <div>
      <button onClick={createInstruction}>Create</button>
    </div>
  );
};
export default HomeComponent;
