"use client";
import { useState, useEffect } from "react"; //we use "use client" and useState to keep track of the phrase
                                  // as when then page re-renders and we are using normal variables instead of useState then the value refreshes to initial value
import {generateMnemonic} from "bip39"  
import SolanaWallet from "./solanaWallet";

export default function WalletPage(){
  // Initialize to empty string (safe for both server and client)
  const [mnemonic , setMnemonics] = useState<string>("");

  // Load from localStorage after hydration (safe, no cascading renders)
  useEffect(() => {
    const savedMnemonic = localStorage.getItem("storedMnemonic");
    if (savedMnemonic) {
      // Defer setState to after effect completes (prevents warning)
      setTimeout(() => setMnemonics(savedMnemonic), 0);
    }
  }, []);

  // Save mnemonic whenever it changes
  useEffect(() => {
    if (mnemonic) {
      localStorage.setItem("storedMnemonic", mnemonic);
    }
  }, [mnemonic]); // Runs every time mnemonic changes
  const handleGenerate = () => {
      const mn  = generateMnemonic() // Uses bip39 to create the 12 words
      setMnemonics(mn);
  };
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Web Wallet</h1>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          {mnemonic ? "Regenerate Seed Phrase" : "Generate Seed Phrase"}
        </button>
         <button
          onClick={() => {
           localStorage.clear();
           setMnemonics("");
           window.location.reload(); // Refresh page to reset everything
          }}
           className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
           > Clear All Data</button>
        {mnemonic && (
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 shadow-inner">
            <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              Your Secret Recovery Phrase
            </h2>
            {/*   Mapping: .map((word, index) => ...) Instead of writing 12 separate <div> tags for 12 words, we use the .map() function.
                  It loops through the array of words we created with .split(" ").For every word, it returns a small piece of JSX (the UI).
                  The key={index}: React needs a unique ID for every item in a list so it can track changes efficiently. */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {mnemonic.split(" ").map((word, index) => ( 
                <div key={index} className="bg-white p-3 rounded-md border border-gray-300 flex gap-2">
                  <span className="text-gray-400">{index + 1}.</span>
                  <span className="font-mono font-medium text-gray-900">{ " "+ word}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-red-500 font-medium">
              ⚠️ Warning: Never share this phrase. It gives full access to your wallets.
            </p>
          </div>
        )}
        {/* Only show the Solana Wallet section if a mnemonic exists */}
            {mnemonic && <SolanaWallet mnemonic={mnemonic} />}  
      </div>
    </main>
  );
}


