'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useClaim } from './cliam-data-access'
import { useState } from 'react'

export default function ClaimFeature() {
    const { publicKey } = useWallet()
    const { claim } = useClaim()
    const [amount, setAmount] = useState('')
    const [index, setIndex] = useState('')
    const [proof, setProof] = useState('')

    const handleClaim = async () => {
        if (!amount || !index || !proof) {
            return
        }

        try {
            const sig = await claim.mutateAsync({
                index: parseInt(index),
                amount: parseInt(amount),
                proof: proof.split(','),
            })
            console.info('Claimed:', sig)
        } catch (error) {
            console.error('Failed to claim:', error)
        }
    }

    return publicKey ? (
        <div>
            <AppHero
                title="Claim"
                subtitle="Claim your tokens by providing the required information below."
            >
                <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
                    <input
                        type="number"
                        placeholder="Index"
                        className="input input-bordered w-full"
                        value={index}
                        onChange={(e) => setIndex(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        className="input input-bordered w-full"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Merkle Proof (comma-separated)"
                        className="input input-bordered w-full"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleClaim}
                        disabled={claim.isPending}
                    >
                        {claim.isPending ? 'Claiming...' : 'Claim'}
                    </button>
                </div>
            </AppHero>
        </div>
    ) : (
        <div className="max-w-4xl mx-auto">
            <div className="hero py-[64px]">
                <div className="hero-content text-center">
                    <WalletButton />
                </div>
            </div>
        </div>
    )
} 