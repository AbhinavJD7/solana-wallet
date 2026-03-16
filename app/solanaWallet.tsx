"use client" // this make sure this page is rendered on the client side not on the server side
import { useState } from "react"
import { mnemonicToSeedSync } from "bip39"
import { derivePath } from "ed25519-hd-key"
import { Keypair } from "@solana/web3.js"

// We define an Interface to tell TypeScript what "Props" this component expects
interface SolanaWalletProps {
    mnemonic: string;
}

export default function SolanaWallet({ mnemonic }: SolanaWalletProps) {
    // We keep track of how many wallets we have generated
    const [currentIndex, setCurrentIndex] = useState(0);
    // We store the list of public keys in an array
    const [publicKeys, setPublicKeys] = useState<string[]>([]);

    const addWallet = () => {
        // 1. Convert mnemonic to the 512-bit seed (Phase 2 logic)
        const seed = mnemonicToSeedSync(mnemonic);
        
        // 2. Define the path using our currentIndex (Phase 3 logic)
        const path = `m/44'/501'/${currentIndex}'/0'`;
        
        // 3. Derive the child seed
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        
        // 4. Create the Keypair
        const keypair = Keypair.fromSeed(derivedSeed);
        
        // 5. Update state: Increment index and add the new public key to our list
        setCurrentIndex(currentIndex + 1);
        setPublicKeys([...publicKeys, keypair.publicKey.toBase58()]);
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
                {publicKeys.map((key, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Wallet {index}</p>
                            <p className="font-mono text-sm break-all">{key}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}