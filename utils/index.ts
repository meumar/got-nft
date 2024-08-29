import { PublicKey, clusterApiUrl, Connection, GetProgramAccountsFilter } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

import { download, upload } from "thirdweb/storage";
import { createThirdwebClient } from "thirdweb";
import { THIRD_WEB_CLIENT } from "./../constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export const validateSolAddress = (address: string) => {
  try {
    let pubkey = new PublicKey(address);
    let isSolana = PublicKey.isOnCurve(pubkey.toBuffer());
    return isSolana;
  } catch (error) {
    return false;
  }
};

export const newPublicKey = (address: string) => {
  return new PublicKey(address);
};

export const accountDetails = borsh.struct([
  borsh.publicKey("owner_account"),
  borsh.publicKey("token_account"),
  borsh.u64("price"),
  borsh.u64("timestamp"),
]);

export const sellAccoutDesiriazation = (account: any) => {
  const offset = 8;
  const {
    owner_account,
    token_account,
    price,
    timestamp
  } = accountDetails.decode(account.data.slice(offset, account.data.length));
  return {
    price: price.toNumber(),
    timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
    owner_account: owner_account.toBase58(),
    token_account: token_account.toBase58(),
  };
};

export const transactionDetails = borsh.struct([
  borsh.bool("is_transaction"),
  borsh.publicKey("wallet_account"),
  borsh.publicKey("created_by"),
  borsh.u64("threshold"),
  borsh.publicKey("reciever"),
  borsh.u64("completed_signers"),
  borsh.u64("timestamp"),
  borsh.u64("amount"),
  borsh.u8("status"),
  borsh.str("name"),
]);

export const transactionAccoutDesiriazation = (account: any) => {
  const offset = 8,
    usersOffset = 8 + 32 + 1 + 18;
  const {
    is_transaction,
    wallet_account,
    name,
    amount,
    created_by,
    threshold,
    reciever,
    completed_signers,
    timestamp,
    status,
  } = transactionDetails.decode(
    account.data.slice(offset, account.data.length)
  );

  return {
    is_transaction: is_transaction,
    created_by: created_by.toBase58(),
    threshold: threshold.toNumber(),
    name,
    amount: amount.toNumber(),
    wallet_account: wallet_account.toBase58(),
    reciever: reciever.toBase58(),
    completed_signers: completed_signers.toNumber(),
    timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
    status: status,
  };
};

export const checkTransaction = borsh.struct([borsh.bool("is_transaction")]);

export const checkIsTransactionAccount = (account: any) => {
  const offset = 8;
  const { is_transaction } = transactionDetails.decode(
    account.data.slice(offset, account.data.length)
  );
  return is_transaction;
};

export const transactionSignDetails = borsh.struct([
  borsh.publicKey("transaction_account"),
  borsh.publicKey("wallet_account"),
  borsh.publicKey("signer"),
  borsh.u64("timestamp"),
]);

export const transactionSignAccoutDesiriazation = (account: any) => {
  const offset = 8;
  const { transaction_account, wallet_account, signer, timestamp } =
    transactionSignDetails.decode(
      account.data.slice(offset, account.data.length)
    );

  return {
    signer: signer.toBase58(),
    wallet_account: wallet_account.toBase58(),
    transaction_account: transaction_account.toBase58(),
    timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
  };
};

export const getInboundTransactions = async (address: string) => {
  const walletAddress: PublicKey = new PublicKey(address);
  const signatures = await connection.getConfirmedSignaturesForAddress2(
    walletAddress
  );

  const inboundTransactions = [];
  for (let signatureInfo of signatures) {
    const transaction: any = await connection.getConfirmedTransaction(
      signatureInfo.signature
    );
    if (transaction && transaction.meta && transaction.meta.postBalances && transaction.transaction) {
      const accountKeys = transaction.transaction._message.accountKeys;
      const postBalances = transaction.meta.postBalances;
      const preBalances = transaction.meta.preBalances;
      const walletIndex = accountKeys.findIndex(
        (key: any) => key.toString() === walletAddress.toString()
      );
      const blockTime = transaction.blockTime;
      const transactionDate = new Date(blockTime * 1000).toLocaleString();
      if (walletIndex >= 0) {
        if (postBalances[walletIndex] != preBalances[walletIndex]) {
          inboundTransactions.push({
            signature: signatureInfo.signature,
            amount: postBalances[walletIndex] - preBalances[walletIndex],
            transactionDate,
            transaction,
          });
        }
      }
    }
  }
  return inboundTransactions;
}

const client = createThirdwebClient({
  clientId: THIRD_WEB_CLIENT,
});

export const uploadFile = async (name: string, description: string, attributes: any, file: Buffer) => {
  try {
    const imageURL = await upload({
      client,
      files: [file],
    });
    let tokenHttpURL: any = await downloadFile(imageURL);
    console.log("tokenHttpURL", tokenHttpURL);
    console.log("imageURL", imageURL);
    const metaData = {
      name: name,
      description: description,
      image: imageURL,
      animation_url: tokenHttpURL,
      attributes: attributes,
    };
    const metaDataURL = await upload({
      client,
      files: [
        new File([JSON.stringify(metaData, null, 2)], "metaData.json", {
          type: "application/json",
        }),
      ],
    });
    return metaDataURL;
  } catch (err) {
    return err;
  }
};
export const downloadFile = async (uri: string) => {
  try {
    const downloadURL = await download({
      client,
      uri,
    });
    return downloadURL.url;
  } catch (err) {
    return err;
  }
};

export const prepareDragons = async (dragons = []) => {
  let result: any[] = [];
  await Promise.all(dragons.map(async (dragon: any) => {
    try {
      if (dragon.metadata.uri && dragon.metadata.uri.startsWith("ip")) {
        let tokenHttpURL: any = await downloadFile(dragon.metadata.uri);
        const response = await fetch(tokenHttpURL);
        const metaData = await response.json();
        if (metaData?.animation_url.startsWith("https:/")) {
          result.push({
            address: dragon.publicKey,
            name: dragon.metadata.name,
            symbol: dragon.metadata.symbol,
            description: metaData.description,
            attributes: metaData.attributes,
            url: metaData.animation_url
          });
        }
      }
    } catch (e) {

    }
  }));
  return result
}

export const assignOwnership = (dragons: any[] = [], sells: any = []) => {
  return dragons.map(dragon => {
    let sell = sells.find((s: any) => s.token_account == dragon.address);
    if (sell) {
      dragon.owner = sell.owner_account;
      dragon.price = sell.price;
      dragon.date = sell.timestamp;
      dragon.sell = true;
      dragon.sell_address = sell.address;
    }
    return dragon
  })
}


export const getTokenAccounts = async (wallet: string, solanaConnection: Connection) => {
  const filters: GetProgramAccountsFilter[] = [
    {
      dataSize: 165,
    },
    {
      memcmp: {
        offset: 32,
        bytes: wallet,
      },
    }];
  const accounts = await solanaConnection.getParsedProgramAccounts(
    TOKEN_PROGRAM_ID,
    { filters: filters }
  );
  let result: any = [];
  accounts.forEach((account, i) => {
    const parsedAccountInfo: any = account.account.data;
    const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
    const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
    if (tokenBalance > 0) {
      result.push(mintAddress);
    }
  });
  return result
}