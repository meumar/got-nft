"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import { toast } from "react-toastify";

import { generateSigner, publicKey, percentAmount } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import {
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata';

import { useProgram } from "./WalletContextProvider";
// import idl from "../../../idl.json";

import { useConnection } from "@solana/wallet-adapter-react";

import { PROGRAM_ID } from "../../../constants";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import LoadingComponent from "./Loading";
import { uploadFile, downloadFile } from "../../../utils";


interface attribute {
  trait_type: string,
  value: string
}

export default function CreateDragon() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attributes, setAttributes] = useState<attribute[]>([]);

  const [newTraitType, setNewTraitType] = useState<string>("");
  const [newTraitValue, setNewTraitValue] = useState<string>("");
  const [file, setFile] = useState<Buffer | null>(null);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const { publicKey }: any = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const wallet = useWallet();



  const umi = createUmi(clusterApiUrl('devnet')).use(walletAdapterIdentity(wallet)).use(mplTokenMetadata()).use(mplCandyMachine());

  useEffect(() => {
    if (!publicKey) {
      setError("Please connect your wallet!");
    } else {
      setError("");
    }
  }, [publicKey]);

  const ensureFiveLengthArray = (arr: string[], str: string) => {
    while (arr.length < 5) {
      arr.push(str);
    }
    return arr.slice(0, 5);
  };

  const addTrait = () => {
    setAttributes([...attributes, ...[{ trait_type: newTraitType, value: newTraitValue }]]);
    setNewTraitType("");
    setNewTraitValue("");
  };

  const removeTrait = (name: string) => {
    setAttributes(attributes.filter((addr) => addr.trait_type !== name));
  };


  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const arrayBuffer = await selectedFile.arrayBuffer();
      setFile(Buffer.from(arrayBuffer));
    }
  };

  const createNFT = async () => {
    if (!name) {
      toast.error("Please enter the name of the NFT");
      return;
    }
    if (!description) {
      toast.error("Please enter the description of the NFT");
      return;
    }
    if (!file) {
      toast.error("Please upload an image for the NFT");
      return;
    }
    try {
      setLoading(true);
      let tokenURL: any = await uploadFile(name, description, attributes, file);
      console.log("tokenURL", tokenURL);
      const mint = generateSigner(umi);
      console.log("USER", mint.publicKey, mint)
      await createNft(umi, {
        mint,
        name: name,
        symbol: symbol,
        uri: tokenURL,
        sellerFeeBasisPoints: percentAmount(5.5),
      }).sendAndConfirm(umi);
      const asset = await fetchDigitalAsset(umi, mint.publicKey);
      console.log("asset", asset);

      setLoading(false);
      toast.success("NFT successfully minted!");
      router.push(`/nft`);
    } catch (err: any) {
      setLoading(false);
      toast.error("Something went wrong");
    }
  };

  return (
    <main className="flex items-center justify-center">
      <>
        <div className="justify-center items-center flex w-full">
          <div className="relative w-full my-6 mx-auto max-w-3xl">
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full dark:bg-gray-800 outline-none ">
              <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                <h3 className="text-3xl font-semibold">Mint dragon</h3>
              </div>
              <div className="relative px-6 py-2 flex-auto">
                <form>
                  <div className="grid gap-6 mb-6 md:grid-cols-1">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Dragon name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Name"
                        required
                        value={name}
                        onChange={(value) => setName(value.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Symbol
                      </label>
                      <input
                        type="text"
                        id="symbol"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Symbol"
                        required
                        value={symbol}
                        onChange={(value) => setSymbol(value.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Description
                      </label>
                      <input
                        type="text"
                        id="description"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="description"
                        required
                        value={description}
                        onChange={(value) =>
                          setDescription(value.target.value)
                        }
                      />
                    </div>
                  </div>
                </form>
                <div className="flex flex-col gap-3 border-t border-solid border-blueGray-200 pt-5">
                  <label
                    htmlFor="last_name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Upload image
                  </label>
                  <input
                    className="w-full p-3 bg-gray-50 text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="file"
                    onChange={handleFileInput}
                  />
                </div>
                <div className="flex flex-row gap-3 border-t border-solid border-blueGray-200 pt-5">
                  <input
                    type="text"
                    id="last_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Trait type"
                    required
                    value={newTraitType}
                    onChange={(value) => setNewTraitType(value.target.value)}
                  />
                  <input
                    type="text"
                    id="last_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Value"
                    required
                    value={newTraitValue}
                    onChange={(value) => setNewTraitValue(value.target.value)}
                  />
                  <button disabled={!newTraitType || !newTraitValue} onClick={() => addTrait()}>
                    Add
                  </button>
                </div>
                <div className="mt-3 mb-5">
                  {attributes.map((attribute, index) => (
                    <div key={index} className="flex flex-row gap-3 mt-5">
                      <p className="mt-3">{index + 1}</p>
                      <input
                        type="text"
                        id="trait_type"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Trait type"
                        required
                        value={attribute.trait_type}
                        disabled={true}
                      />
                      <input
                        type="text"
                        id="value"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Value"
                        required
                        value={attribute.value}
                        disabled={true}
                      />
                      <button
                        className="mt-1 text-red-500"
                        onClick={() => removeTrait(attribute.trait_type)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {error && (
                <div
                  className="px-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                  role="alert"
                >
                  <span className="font-medium">Warning!</span> {error}
                </div>
              )}
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                {loading ? (
                  <LoadingComponent />
                ) : (
                  <>
                    {publicKey && (
                      <button
                        className="text-blue-500"
                        type="button"
                        onClick={() => createNFT()}
                        disabled={!name || !symbol}
                      >
                        {"Mint"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    </main>
  );
}
