"use client";

import { useState, useEffect } from "react";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

interface SolanaWalletProps {
    mnemonic: string;
}

type TokenBalance = {
    mint: string;
    amount: number;
};

type WalletEntry = {
    address: string;
    balance: number | null;
    tokens: TokenBalance[];
};

const shortMint = (mint: string) => `${mint.slice(0, 4)}...${mint.slice(-4)}`;

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export default function SolanaWallet({ mnemonic }: SolanaWalletProps) {
    // Initialize identically for server and client
    const [currentIndex, setCurrentIndex] = useState(0);
    const [wallets, setWallets] = useState<WalletEntry[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const connection = new Connection(clusterApiUrl("devnet"));

    // Load from localStorage after hydration (safe, runs once after mount)
    useEffect(() => {
        const savedWallets = localStorage.getItem("storedWallets");
        const savedIndex = localStorage.getItem("storedIndex");

        // Defer setState to after effect completes (prevents warning)
        if (savedWallets || savedIndex) {
            setTimeout(() => {
                if (savedWallets) {
                    setWallets(JSON.parse(savedWallets));
                }
                if (savedIndex) {
                    setCurrentIndex(Number(savedIndex));
                }
            }, 0);
        }
    }, []);

    useEffect(() => {
        if (wallets.length > 0) {
            localStorage.setItem("storedWallets", JSON.stringify(wallets));
        }
    }, [wallets]); // Runs every time wallets changes

    useEffect(() => {
        localStorage.setItem("storedIndex", currentIndex.toString());
    }, [currentIndex]);

    const addWallet = () => {
        const seed = mnemonicToSeedSync(mnemonic);
        const path = `m/44'/501'/${currentIndex}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const keypair = Keypair.fromSeed(derivedSeed);

        setCurrentIndex((prevIndex) => prevIndex + 1);
        setWallets((prevWallets) => [
            ...prevWallets,
            {
                address: keypair.publicKey.toBase58(),
                balance: null,
                tokens: [],
            },
        ]);
    };

    const getBalance = async (index: number) => {
        try {
            if (!wallets[index]) return;

            const publicKey = new PublicKey(wallets[index].address);
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / LAMPORTS_PER_SOL;

            setWallets((prevWallets) =>
                prevWallets.map((wallet, i) =>
                    i === index ? { ...wallet, balance: sol } : wallet
                )
            );

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });

            const tokens: TokenBalance[] = tokenAccounts.value.map((account) => {
                const parsedInfo = account.account.data.parsed.info;
                return {
                    mint: parsedInfo.mint as string,
                    amount: Number(parsedInfo.tokenAmount.uiAmount ?? 0),
                };
            });

            setWallets((prevWallets) =>
                prevWallets.map((wallet, i) =>
                    i === index ? { ...wallet, tokens } : wallet
                )
            );
        } catch (error) {
            console.error("Failed to fetch balance/tokens:", error);
        }
    };

    const copyToClipboard = (index: number) => {
        if (!wallets[index]) return;
        void navigator.clipboard.writeText(wallets[index].address);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="mt-10 w-full flex flex-col items-center">
            <button
                onClick={addWallet}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition mb-6"
            >
                Add Solana Wallet
            </button>

            <div className="w-full space-y-4">
                {wallets.map((wallet, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Wallet {index}</p>
                                <p className="font-mono text-sm break-all text-gray-900">{wallet.address}</p>
                                <p className="mt-2 text-sm font-semibold text-gray-700">
                                    Balance: {wallet.balance !== null ? `${wallet.balance} SOL` : "--"}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => void getBalance(index)}
                                    className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={() => copyToClipboard(index)}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    {copiedIndex === index ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>

                        {wallet.tokens.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tokens</p>
                                <div className="space-y-2">
                                    {wallet.tokens.map((token, tokenIndex) => (
                                        <div
                                            key={tokenIndex}
                                            className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                                        >
                                            <span className="font-mono text-xs text-gray-500">
                                                {shortMint(token.mint)}
                                            </span>
                                            <span className="font-bold text-sm">{token.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};