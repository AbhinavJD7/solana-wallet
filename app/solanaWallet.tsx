"use client" // this make sure this page is rendered on the client side not on the server side
import { useState } from "react"
import { mnemonicToSeedSync } from "bip39"
import { derivePath } from "ed25519-hd-key"
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"

// We define an Interface to tell TypeScript what "Props" this component expects
interface SolanaWalletProps {
    mnemonic: string;
}

export default function SolanaWallet({ mnemonic }: SolanaWalletProps) {
    // We keep track of how many wallets we have generated
    const [currentIndex, setCurrentIndex] = useState(0);
    // We store the list of public keys in an array
    const [publicKeys, setPublicKeys] = useState<{ address: string, balance: number | null }[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const connection = new Connection(clusterApiUrl("devnet"));

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
        setCurrentIndex((prevIndex) => prevIndex + 1);
        setPublicKeys((prevKeys) => [
            ...prevKeys,
            { address: keypair.publicKey.toBase58(), balance: null },
        ]);
    };

    const getBalance = async (index: number) => {
        try{
            if (!publicKeys[index]) return;
            const publicKey = new PublicKey(publicKeys[index].address);
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / LAMPORTS_PER_SOL; // Convert lamports to SOL
            setPublicKeys((prevKeys) => 
                prevKeys.map((key, i) => 
                    i === index ? { ...key, balance: sol } : key
                )
            );
        }
        catch(error){
            console.error("Invalid public key failed to fetch balance:", error);
            return;
        }
    };
    const copyToClipboard = (index: number) => {
        navigator.clipboard.writeText(publicKeys[index].address);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    }
    return (
        <div className="mt-10 w-full flex flex-col items-center">
            <button
                onClick={addWallet}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition mb-6"
            >
                Add Solana Wallet
            </button>

            <div className="w-full space-y-4">
                {publicKeys.map((wallet, index) => (
                    <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
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
                ))}
                
            </div>
        </div>
    );
}