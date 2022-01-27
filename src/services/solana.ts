import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import { Wallet } from '@drift-labs/sdk';

export const connection = new Connection(process.env.RPC_ADDRESS, 'finalized');

export function getWalletFromPrivateKey(privateKey: Iterable<number>): Wallet {
  const keypair = Keypair.fromSecretKey(
		Uint8Array.from(privateKey)
	);
	return new Wallet(keypair);
}
