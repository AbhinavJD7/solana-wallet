"use client";

import { useState, useEffect } from "react";
import { generateMnemonic } from "bip39";
import { motion } from "motion/react";
import { Check, Copy, Plus, ShieldCheck, Trash2, Eye, EyeOff } from "lucide-react";
import SolanaWallet from "./solanaWallet";

export default function WalletPage() {
  const [mnemonic, setMnemonics] = useState<string>("");
  const [showPhrase, setShowPhrase] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [addWalletSignal, setAddWalletSignal] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("storedMnemonic");
    if (saved) setTimeout(() => setMnemonics(saved), 0);
  }, []);

  useEffect(() => {
    if (mnemonic) localStorage.setItem("storedMnemonic", mnemonic);
  }, [mnemonic]);

  const handleGenerate = () => {
    const mn = generateMnemonic();
    setMnemonics(mn);
    setShowPhrase(false);
    localStorage.removeItem("storedWallets");
    localStorage.setItem("storedIndex", "0");
    setAddWalletSignal(0);
  };

  const handleClearAll = () => {
    localStorage.clear();
    setMnemonics("");
    setShowPhrase(false);
    window.location.reload();
  };

  const handleAddWallet = () => {
    setAddWalletSignal((prev) => prev + 1);
  };

  const copyPhrase = () => {
    void navigator.clipboard.writeText(mnemonic);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  return (
    <main className="min-h-screen flex justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-4xl space-y-10">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[11px] font-bold tracking-[0.16em] uppercase"
          >
            <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Powered by Solana
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="gradient-title text-5xl sm:text-6xl font-black tracking-tight"
          >
            Web Wallet
          </motion.h1>
          <p className="text-white/45 max-w-md mx-auto text-base sm:text-lg">
            Generate HD wallets from a secure seed phrase. Your keys, your crypto.
          </p>
        </header>

        {!mnemonic && (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 font-bold text-lg text-white bg-[#9945FF] shadow-[0_12px_40px_rgba(153,69,255,0.35)]"
            >
              <Plus className="size-5" />
              Create Wallet
            </motion.button>
          </div>
        )}

        {/* Recovery Phrase Section */}
        {mnemonic && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#9945FF]" />
                  Secret Recovery Phrase
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  Write this down and store it somewhere safe offline.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyPhrase}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10"
                >
                  {copiedPhrase ? (
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <Check className="size-3.5" /> Copied
                    </span>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPhrase((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/10"
                >
                  {showPhrase ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showPhrase ? "Hide Phrase" : "Reveal Phrase"}
                </motion.button>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6 relative overflow-hidden">
              <div
                className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-300 ${
                  !showPhrase ? "blur-xl opacity-30 scale-[0.98] pointer-events-none select-none" : ""
                }`}
              >
                {mnemonic.split(" ").map((word, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-2.5 bg-white/5 border border-white/5"
                  >
                    <span className="block text-[10px] text-white/30 mono">{i + 1}</span>
                    <span className="mt-0.5 block mono text-sm font-semibold text-white/90">
                      {word}
                    </span>
                  </div>
                ))}
              </div>

              {!showPhrase && (
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPhrase(true)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm font-semibold text-white/90 hover:bg-white/15"
                  >
                    Click to Reveal Phrase
                  </motion.button>
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-white/8 flex items-center gap-2 text-xs text-amber-300/80">
                <ShieldCheck className="size-3.5" />
                <p>
                  Never share this phrase with anyone. Anyone with these 12 words controls your wallet.
                </p>
              </div>
            </div>
          </section>
        )}

        {mnemonic && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddWallet}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#9945FF] rounded-2xl font-bold text-lg shadow-[0_10px_35px_rgba(153,69,255,0.35)]"
              >
                <Plus className="size-5" />
                Add Wallet
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearAll}
                className="flex items-center gap-2 px-8 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl font-bold text-lg transition-colors"
              >
                <Trash2 className="size-5" />
                Clear All Data
              </motion.button>
            </div>

            <SolanaWallet mnemonic={mnemonic} addWalletSignal={addWalletSignal} />

            <footer className="text-center pt-8 text-white/20 text-xs font-medium tracking-[0.18em] uppercase">
              &copy; 2026 Solana Web Wallet • Secure • Decentralized
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
