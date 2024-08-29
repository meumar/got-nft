import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Button } from "@nextui-org/button";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "react-toastify";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/modal";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useRouter } from "next/navigation";


import { getWalletAta } from "../WalletContextProvider";
import { useProgram } from "../WalletContextProvider";
import { Input } from "@nextui-org/input";
import { PROGRAM_ID } from "../../../../constants";

const DragonCard = ({
    name,
    description,
    url,
    price,
    owner,
    address,
    sell,
    sell_address
}: {
    name: string;
    description: string;
    url: string;
    price: number,
    owner: string,
    address: string,
    sell: boolean,
    sell_address: string
}) => {
    const [newPrice, setNewPrice] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const { connection } = useConnection();
    const { publicKey }: any = useWallet();
    const program = useProgram();
    const router = useRouter();


    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const createProgramWallet = async () => {
        const [program_wallet, wallet_bump] =
            PublicKey.findProgramAddressSync(
                [
                    Buffer.from("wallet"),
                ],
                new PublicKey(PROGRAM_ID)
            );
        let programWalletAccount = await connection.getAccountInfo(
            program_wallet
        );
        if (programWalletAccount == null) {
            toast.warning("Please create wallet for program");
            const sign = await program.methods
                .createNftWallet()
                .accounts({
                    programWallet: program_wallet,
                    signer: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([])
                .rpc();
        }
        return program_wallet
    };

    const createProgramTokenATA = async (program_wallet: any) => {
        const [program_ata, bump_token] =
            PublicKey.findProgramAddressSync(
                [new PublicKey(address).toBuffer()],
                new PublicKey(PROGRAM_ID)
            );

        let programAtaData = await connection.getAccountInfo(
            program_ata
        );
        if (programAtaData == null) {
            toast.warning("Please create ATA for program wallet");
            const sign = await program.methods
                .createNftTokenAccount()
                .accounts({
                    programTokenAccount: program_ata,
                    programWallet: program_wallet,
                    mint: address,
                    signer: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                })
                .signers([])
                .rpc();
        }
        return program_ata
    };


    const listForSale = async () => {
        try {
            setLoading(true);
            const program_wallet = await createProgramWallet();
            const program_token_ata = await createProgramTokenATA(program_wallet);
            const [selling_account, wallet_bump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("sell"),
                        publicKey.toBuffer(),
                        new PublicKey(address).toBuffer()
                    ],
                    new PublicKey(PROGRAM_ID)
                );
            const user_ata = await getWalletAta(publicKey, new PublicKey(address));
            let sellingAccountData = await connection.getAccountInfo(
                selling_account
            );
            if (sellingAccountData == null) {
                const sign = await program.methods
                    .createNftSellAccount(new anchor.BN(newPrice),)
                    .accounts({
                        userAta: user_ata,
                        programAta: program_token_ata,
                        sellRequest: selling_account,
                        mint: address,
                        signer: publicKey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID
                    })
                    .signers([])
                    .rpc();
            } else {
                const sign = await program.methods
                    .resellNftSellAccount(new anchor.BN(newPrice),)
                    .accounts({
                        userAta: user_ata,
                        programAta: program_token_ata,
                        programWallet: program_wallet,
                        sellRequest: selling_account,
                        mint: address,
                        signer: publicKey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID
                    })
                    .signers([])
                    .rpc();
            }
            setLoading(false);
            router.push(`/marketplace`);
        } catch (e) {
            console.log("program_walletprogram_wallet", e);
            setLoading(false);
        }
    };

    const withdrawNFTSell = async () => {
        try {
            setLoading(true);
            const [program_wallet, wallet_bump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("wallet"),
                    ],
                    new PublicKey(PROGRAM_ID)
                );
            const program_token_ata = await createProgramTokenATA(program_wallet);
            const [selling_account, selling_account_bump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("sell"),
                        publicKey.toBuffer(),
                        new PublicKey(address).toBuffer()
                    ],
                    new PublicKey(PROGRAM_ID)
                );
            const user_ata = await getWalletAta(publicKey, new PublicKey(address));
            const sign = await program.methods
                .withdrawNftSellAccount(wallet_bump)
                .accounts({
                    userAta: user_ata,
                    programAta: program_token_ata,
                    programWallet: program_wallet,
                    sellRequest: selling_account,
                    mint: address,
                    signer: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID
                })
                .signers([])
                .rpc();
            setLoading(false);
            router.push(`/nft`);
        } catch (e) {
            setLoading(false);
            console.log("withdrawNFTSell", e);
        }
    }

    const buyNft = async () => {
        try {
            setLoading(true);
            const [program_wallet, wallet_bump] =
                PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("wallet"),
                    ],
                    new PublicKey(PROGRAM_ID)
                );
            const program_token_ata = await createProgramTokenATA(program_wallet);
            const user_ata = await getWalletAta(publicKey, new PublicKey(address));
            const sign = await program.methods
                .buyNft(wallet_bump)
                .accounts({
                    userAta: user_ata,
                    programAta: program_token_ata,
                    sellRequest: new PublicKey(sell_address),
                    mint: address,
                    programWallet: program_wallet,
                    ownerAccount: new PublicKey(owner),
                    signer: publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([])
                .rpc();
            setLoading(false);
            toast.success("Congrats you own " + name);
            router.push(`/nft`);
        } catch (e) {
            setLoading(false);
            console.log("withdrawNFTSell", e);
        }
    }

    const checkNFT = async () => {
        const userATA = getWalletAta(publicKey, new PublicKey(address));
        let programTokenCheck = await connection.getAccountInfo(
            userATA
        );
        if (programTokenCheck == null) {
            toast.error("You don't have this NFT");
            return false
        }
        return true
    };

    const checkUserATA = async () => {
        const userATA = getWalletAta(publicKey, new PublicKey(address));
        let programTokenCheck = await connection.getAccountInfo(
            userATA
        );
        if (programTokenCheck == null) {
            toast.warning("You don't have this NFT. Please create account");
            const sign = await program.methods
                .createUserNftTokenAccount()
                .accounts({
                    tokenAccount: userATA,
                    mint: address,
                    signer: publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
                })
                .signers([])
                .rpc();
        }
    };

    const sellCheck = async () => {
        const check: boolean = await checkNFT();
        if (check) {
            onOpen();
        }
    }
    const withdrawCheck = async () => {
        const check: boolean = await checkNFT();
        if (check) {
            withdrawNFTSell();
        }
    }
    const checkBuyNft = async () => {
        setLoading(true);
        await checkUserATA();
        await buyNft();
        setLoading(false);
    }
    let footer = <></>;
    if (owner == publicKey.toBase58()) {
        if (sell) {
            footer = <Button color="primary" variant="ghost" onClick={withdrawCheck} size="sm" isLoading={loading}>
                Withdraw
            </Button>
        } else {
            footer = <Button color="primary" variant="ghost" onClick={sellCheck} size="sm" isLoading={loading}>
                List for sale
            </Button>
        }
    } else if (sell) {
        footer = <Button color="primary" variant="ghost" onClick={checkBuyNft} size="sm" isLoading={loading}>
            Buy
        </Button>
    }
    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="bg-gray-900">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">NFT Price</ModalHeader>
                            <ModalBody>
                                <div>
                                    <Input type="number" variant={"bordered"} label="Prie"
                                        onChange={(value) => setNewPrice(Number(value.target.value))} />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={listForSale} isDisabled={!newPrice || newPrice === 0} isLoading={loading}>
                                    Continue
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            <Card className="py-4">
                <CardHeader className="pb-0 pt-2 px-4 items-start justify-between">
                    <div>
                        <h4 className="font-bold text-large">{name}</h4>
                        <small className="text-default-500">{description}</small>
                    </div>
                    {
                        price && <h4 className="font-bold text-large">$ {price}</h4>
                    }
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                    <Image
                        alt="Card background"
                        className="object-cover rounded-xl"
                        src={url}
                        width={270}
                        height={300}
                    />
                </CardBody>
                <CardFooter>
                    <div className="w-full">
                        {footer}
                    </div>
                </CardFooter>
            </Card>
        </>

    );
}

export default DragonCard;
