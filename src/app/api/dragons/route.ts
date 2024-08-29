import {
    PublicKey,
    Connection,
    clusterApiUrl,
    GetProgramAccountsConfig,
} from "@solana/web3.js";
import { PROGRAM_ID } from "../../../../constants";

let connection = new Connection(clusterApiUrl("devnet"), "confirmed");

import {
    getTokenAccounts,
    sellAccoutDesiriazation,
} from "../../../../utils/index";

const GET = async (
    request: Request
) => {
    try {
        const config: GetProgramAccountsConfig = {
            filters: [
                // {
                //   memcmp: {
                //     offset: 8,
                //     bytes: "1",
                //   },
                // },
            ],
        };
        const [program_wallet, wallet_bump] =
            PublicKey.findProgramAddressSync(
                [
                    Buffer.from("wallet"),
                ],
                new PublicKey(PROGRAM_ID)
            );
        let program_tokens = await getTokenAccounts(program_wallet.toBase58().toString(), connection);
        let accounts = await connection.getProgramAccounts(
            new PublicKey(PROGRAM_ID),
            config
        );
        let filteredAccounts = await filterWallets(accounts, program_tokens);
        return Response.json(filteredAccounts);
    } catch (e) {
        return Response.json([]);
    }
};

const filterWallets = async (filterWallets: any, program_tokens: any) => {
    try {
        let accounts: any = [];
        await Promise.all(
            filterWallets.map(async ({ pubkey, account }: any) => {
                try {
                    if (account.space > 8) {
                        const {
                            owner_account,
                            token_account,
                            price,
                            timestamp
                        } = sellAccoutDesiriazation(account);
                        if(program_tokens.includes(token_account)){
                            accounts.push({
                                owner_account,
                                token_account,
                                price,
                                timestamp,
                                address: pubkey.toBase58(),
                            });
                        }
                    }
                    return pubkey;
                } catch (e) { }
            })
        );
        return accounts;
    } catch (error) {
        return [];
    }
};

const checkUserExisted = (users: string[], address: string) => {
    return users.includes(address);
};

export { GET };
