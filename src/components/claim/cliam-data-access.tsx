'use client'

import { useConnection } from '@solana/wallet-adapter-react'
import { SYSVAR_RENT_PUBKEY, SystemProgram, Cluster, Keypair, PublicKey, ComputeBudgetProgram, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import IDL from './claim.json'
import { BN, Program } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'

export function useClaimProgram() {
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
    const { program, programId, mint, base, } = useClaimProgram()
    const { publicKey: claimant, wallet } = useWallet()
    const { connection } = useConnection()

    const claim = async (index: number, amount: number, proof: string[]) => {
        if (!claimant) throw new Error('Wallet not connected')

        const [distributor] = PublicKey.findProgramAddressSync(
            [Buffer.from("MerkleDistributor"), base.toBuffer()],
            programId
        );


        const fromAta = await getAssociatedTokenAddress(mint, distributor, true)
        const toAta = await getAssociatedTokenAddress(mint, claimant)
        const [claimStatus] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('ClaimStatus'),
                new BN(index).toArrayLike(Buffer, 'le', 8),
                distributor.toBuffer(),
            ],
            programId
        )

        const proof_buf = proof.map(p => new BN(p.slice(2), 'hex').toArrayLike(Buffer, 'be', 32));
        console.log(proof_buf.map(p => p.toString("hex")))

        const accounts = {
            distributor,
            claimStatus,
            from: fromAta,
            to: toAta,
            claimant,
            payer: claimant,
        };

        const tx = new Transaction()
            .add(
                ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
                await (program.methods as any).claim(
                    new BN(index),
                    new BN(amount),
                    proof_buf
                ).accounts(accounts)
                    .instruction()
            )
        await (wallet?.adapter as any).prepareTransaction(tx, connection, {});
        console.log(tx.serialize({ verifySignatures: false, requireAllSignatures: false }).toString("hex"));

        const sig = await wallet?.adapter.sendTransaction(tx, connection, { skipPreflight: true })
        console.log(sig);
        return sig


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