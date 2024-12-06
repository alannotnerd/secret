'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import { SYSVAR_RENT_PUBKEY, SystemProgram, Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import IDL from './claim.json'
import { BN, Program } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'

export function useClaimProgram() {
    const { connection } = useConnection()
    const { cluster } = useCluster()
    const provider = useAnchorProvider()
    const programId = useMemo(() => new PublicKey("BDSchMcYS2porfeisQoVNgtbJeqrgCxTU6bwYaaWY9ci"), [cluster])
    const mint = useMemo(() => new PublicKey("DMuyhqfFTnW6XjERkLPVQZFRNRJ79McFaUYBWNgPi1rL"), [cluster])
    const base = useMemo(() => new PublicKey("sosMrprj6yvZ5tGgWWZsKK2xnxNPFQSYAiHdkFQU1b2"), [cluster])
    const program = new Program(IDL as any, provider)

    return {
        program,
        mint,
        base,
        programId,
    }
}

export function useClaim() {
    const { program, programId, mint, base } = useClaimProgram()
    const { publicKey: claimant } = useWallet()

    const claim = async (index: number, amount: number, proof: string[]) => {
        if (!claimant) throw new Error('Wallet not connected')

        const [distributor] = PublicKey.findProgramAddressSync(
            [Buffer.from("MerkleDistributor"), base.toBuffer()],
            programId
        );

        const fromAta = await getAssociatedTokenAddress(mint, distributor)
        const toAta = await getAssociatedTokenAddress(mint, claimant)
        const [claimStatus] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('ClaimStatus'),
                Buffer.from(new BN(index).toArray('le', 8)),
                distributor.toBuffer(),
            ],
            programId
        )

        const accounts = {
            distributor,
            claimStatus,
            from: fromAta,
            to: toAta,
            claimant,
            payer: claimant,
        };

        (program.methods as any)
            .claim(index, new BN(amount), proof)
            .accounts(accounts)
            .rpc();
    }

    return {
        claim: useMutation({
            mutationFn: ({ index, amount, proof }: {
                index: number
                amount: number
                proof: string[]
            }) => claim(index, amount, proof),
        }),
    }
}