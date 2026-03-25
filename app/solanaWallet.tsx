"use client";

import { useState, useEffect, useRef } from "react";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, ExternalLink, RefreshCw, Wallet as WalletIcon, Trash2 } from "lucide-react";

interface SolanaWalletProps {
    mnemonic: string;
    addWalletSignal: number;
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

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

type CopiedState = {
    index: number;
    id: string;
} | null;

const shortMint = (mint: string) => `${mint.slice(0, 4)}...${mint.slice(-4)}`;
const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-6)}`;

export default function SolanaWallet({ mnemonic, addWalletSignal }: SolanaWalletProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const [wallets, setWallets] = useState<WalletEntry[]>([]);
    const [copiedState, setCopiedState] = useState<CopiedState>(null);
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

    const connection = new Connection(clusterApiUrl("devnet"));

    useEffect(() => {
        const savedWallets = localStorage.getItem("storedWallets");
        const savedIndex = localStorage.getItem("storedIndex");
        if (savedWallets || savedIndex) {
            setTimeout(() => {
                if (savedWallets) {
                    const parsed = JSON.parse(savedWallets) as WalletEntry[];
                    // Deduplicate by address just in case
                    const unique = parsed.filter((w, i, arr) => arr.findIndex(x => x.address === w.address) === i);
                    setWallets(unique);
                }
                if (savedIndex) {
                    const idx = Number(savedIndex);
                    currentIndexRef.current = idx;
                    setCurrentIndex(idx);
                }
            }, 0);
        }
    }, []);

    useEffect(() => {
        if (wallets.length > 0) {
            localStorage.setItem("storedWallets", JSON.stringify(wallets));
        }
    }, [wallets]);

    useEffect(() => {
        localStorage.setItem("storedIndex", currentIndex.toString());
    }, [currentIndex]);

    useEffect(() => {
        const savedWallets = localStorage.getItem("storedWallets");
        if (!savedWallets && wallets.length === 0) {
            addWallet();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (addWalletSignal > 0) {
            addWallet();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addWalletSignal]);

    const addWallet = () => {
        const seed = mnemonicToSeedSync(mnemonic);
        // Use ref so we always get the latest index, never a stale closure value
        const index = currentIndexRef.current;
        const path = `m/44'/501'/${index}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const keypair = Keypair.fromSeed(derivedSeed);
        const newAddress = keypair.publicKey.toBase58();

        currentIndexRef.current = index + 1;
        setCurrentIndex(index + 1);
        setWallets((prev) => {
            // Guard: skip if address already exists
            if (prev.some((w) => w.address === newAddress)) return prev;
            return [...prev, { address: newAddress, balance: null, tokens: [] }];
        });
    };

    const deleteWallet = (index: number) => {
        setWallets((prev) => {
            const next = prev.filter((_, i) => i !== index);
            if (next.length === 0) localStorage.removeItem("storedWallets");
            return next;
        });
    };

    const getBalance = async (index: number) => {
        try {
            if (!wallets[index]) return;
            setLoadingIndex(index);
            const publicKey = new PublicKey(wallets[index].address);
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / LAMPORTS_PER_SOL;

            setWallets((prev) =>
                prev.map((w, i) => (i === index ? { ...w, balance: sol } : w))
            );

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            });
            const tokens: TokenBalance[] = tokenAccounts.value.map((account) => {
                const info = account.account.data.parsed.info as { mint: string; tokenAmount: { uiAmount: number | null } };
                return { mint: info.mint, amount: Number(info.tokenAmount.uiAmount ?? 0) };
            });

            setWallets((prev) =>
                prev.map((w, i) => (i === index ? { ...w, tokens } : w))
            );
        } catch (error) {
            console.error("Failed to fetch balance/tokens:", error);
        } finally {
            setLoadingIndex(null);
        }
    };

    const copyToClipboard = (text: string, index: number, id: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedState({ index, id });
        setTimeout(() => setCopiedState(null), 2000);
    };

    return (
        <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 flex items-center gap-1.5">
                        <WalletIcon className="size-3.5 text-emerald-300" />
                        Wallets
                    </h2>
                    {wallets.length > 0 && (
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                            {wallets.length}
                        </span>
                    )}
                    <span className="ml-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-400/10 text-emerald-300">
                        Devnet
                    </span>
                </div>
            </div>

            {wallets.length === 0 && (
                <div className="glass rounded-2xl py-12 text-center text-white/45">
                    Adding your first wallet...
                </div>
            )}

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {wallets.map((wallet, index) => (
                        <motion.div
                            key={wallet.address}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="glass glass-hover rounded-2xl overflow-hidden"
                        >
                            <div className="h-[2px] bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
                            <div className="p-5 sm:p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b07aff]">
                                            Wallet #{index + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <code className="mono text-sm sm:text-base tracking-tight text-white/85">
                                                {truncateAddress(wallet.address)}
                                            </code>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => copyToClipboard(wallet.address, index, "wallet-address")}
                                                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                                                title="Copy address"
                                            >
                                                {copiedState?.index === index && copiedState.id === "wallet-address" ? (
                                                    <Check className="size-4 text-emerald-300" />
                                                ) : (
                                                    <Copy className="size-4" />
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => void getBalance(index)}
                                            disabled={loadingIndex === index}
                                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-50"
                                            title="Refresh balance"
                                        >
                                            <RefreshCw className={`size-4 ${loadingIndex === index ? "animate-spin" : ""}`} />
                                        </motion.button>
                                        <a
                                            href={`https://explorer.solana.com/address/${wallet.address}?cluster=devnet`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                                            title="Open in Solana Explorer"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => deleteWallet(index)}
                                            className="p-2 rounded-lg text-white/45 hover:text-red-300 hover:bg-red-500/10"
                                            title="Delete wallet"
                                        >
                                            <Trash2 className="size-4" />
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Balance</span>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                                            {wallet.balance !== null ? wallet.balance.toFixed(4) : "--.--"}
                                        </span>
                                        <span className="text-xl font-bold text-white/35 mb-1">SOL</span>
                                    </div>
                                </div>

                                {wallet.tokens.length > 0 && (
                                    <div className="space-y-2 pt-4 border-t border-white/10">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                            SPL Tokens
                                        </span>
                                        {wallet.tokens.map((token, ti) => (
                                            <div
                                                key={`${token.mint}-${ti}`}
                                                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2.5"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-white/85">{shortMint(token.mint)}</p>
                                                    <p className="mono text-[10px] text-white/35">{token.mint}</p>
                                                </div>
                                                <p className="text-sm font-bold text-white/80">{token.amount}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}
