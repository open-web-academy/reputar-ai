import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { getAgentReputation } from '../utils/reputation';
import { 
  IDENTITY_REGISTRY_ADDRESS, 
  REPUTATION_REGISTRY_ADDRESS,
  REPUTATION_REGISTRY_ABI,
  ETHEREUM_SEPOLIA_CHAIN_ID 
} from '../utils/contracts';

export default function RateAgent() {
    const [targetAgentId, setTargetAgentId] = useState('');
    const [reputation, setReputation] = useState<{ avg: number, count: number, total: number } | null>(null);
    const [rateeAgentId, setRateeAgentId] = useState('');
    const [score, setScore] = useState(50);
    const [comment, setComment] = useState('');
    const [status, setStatus] = useState('');
    const { isConnected, provider, signer, address } = useWallet();

    const getReputation = async () => {
        if (!isConnected || !provider) {
            setStatus('Error: Please connect your wallet first');
            return;
        }

        if (!targetAgentId || isNaN(Number(targetAgentId))) {
            setStatus('Error: Please enter a valid Agent ID (number)');
            return;
        }

        try {
            setStatus('Fetching reputation...');
            const rep = await getAgentReputation(targetAgentId, provider);
            
            if (rep) {
                setReputation({
                    avg: rep.averageScore,
                    count: rep.count,
                    total: rep.averageScore * rep.count // Calcular total aproximado
                });
                setStatus('');
            } else {
                setStatus('No reputation data found for this agent');
                setReputation(null);
            }
        } catch (err: unknown) {
            const error = err as Error;
            setStatus(`Error fetching: ${error.message}`);
            setReputation(null);
        }
    };

    const handleSubmit = async () => {
        if (!isConnected || !signer) {
            setStatus('Error: Please connect your wallet first');
            return;
        }

        if (!rateeAgentId || isNaN(Number(rateeAgentId))) {
            setStatus('Error: Please enter a valid Agent ID (number)');
            return;
        }

        if (score < 0 || score > 100) {
            setStatus('Error: Score must be between 0 and 100');
            return;
        }

        try {
            // ========================================================================
            // PASO 1: Obtener Datos
            // ========================================================================
            setStatus('Preparing rating...');
            
            const agentId = parseInt(rateeAgentId, 10);
            const scoreValue = Math.round(score); // Asegurar que sea number 0-100
            const clientAddress = await signer.getAddress();
            
            console.log(`📝 Step 1 - Data prepared: Agent #${agentId}, Score: ${scoreValue}, Client: ${clientAddress}`);

            // ========================================================================
            // PASO 2: Construir el FeedbackAuth Struct
            // ========================================================================
            const authStruct = {
                agentId: agentId,
                clientAddress: clientAddress,
                indexLimit: 1, // Nonce estático para demo
                expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hora de validez
                chainId: 11155111, // Ethereum Sepolia ID
                identityRegistry: IDENTITY_REGISTRY_ADDRESS,
                signerAddress: clientAddress // TRUCO: El usuario es su propio "signer"
            };
            
            console.log('📋 Step 2 - FeedbackAuth struct:', authStruct);

            // ========================================================================
            // PASO 3: Firmar (EIP-191)
            // ========================================================================
            setStatus('Requesting signature...');
            
            // Empaquetar los datos usando solidityPackedKeccak256 con los tipos especificados
            // Tipos: ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address']
            const packedData = ethers.solidityPacked(
                ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address'],
                [
                    authStruct.agentId,
                    authStruct.clientAddress,
                    authStruct.indexLimit,
                    authStruct.expiry,
                    authStruct.chainId,
                    authStruct.identityRegistry,
                    authStruct.signerAddress
                ]
            );
            
            const hash = ethers.keccak256(packedData);
            console.log('🔐 Step 3 - Hash to sign:', hash);
            
            // Generar el hash y pedir la firma
            let signature: string;
            try {
                signature = await signer.signMessage(ethers.getBytes(hash));
                console.log('✅ Step 3 - Signature obtained:', signature);
            } catch (signError: any) {
                if (signError.code === 4001 || signError.message?.includes('rejected') || signError.message?.includes('denied')) {
                    setStatus('User rejected request');
                    return;
                }
                throw signError;
            }

            // ========================================================================
            // PASO 4: Empaquetar para el Contrato
            // ========================================================================
            setStatus('Encoding feedback data...');
            
            // El contrato espera un solo parámetro `bytes feedbackAuth`
            // Debemos codificar la struct y concatenar la firma
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            
            // Codificar la struct completa usando ABI encoding
            const feedbackAuthEncoded = abiCoder.encode(
                ['uint256', 'address', 'uint64', 'uint256', 'uint256', 'address', 'address'],
                [
                    authStruct.agentId,
                    authStruct.clientAddress,
                    authStruct.indexLimit,
                    authStruct.expiry,
                    authStruct.chainId,
                    authStruct.identityRegistry,
                    authStruct.signerAddress
                ]
            );
            
            // Concatenar la firma al final
            const feedbackAuthBytes = ethers.concat([feedbackAuthEncoded, signature]);
            console.log('📦 Step 4 - Final feedbackAuth bytes:', feedbackAuthBytes);

            // ========================================================================
            // PASO 5: Enviar Transacción
            // ========================================================================
            setStatus('Sending transaction...');
            
            // Crear instancia del contrato
            const reputationContract = new ethers.Contract(
                REPUTATION_REGISTRY_ADDRESS,
                REPUTATION_REGISTRY_ABI,
                signer
            );
            
            // Preparar parámetros para giveFeedback
            const tag1Bytes = ethers.encodeBytes32String("demo");
            const tag2Bytes = ethers.ZeroHash;
            const fileuriString = ""; // String vacío
            const filehashBytes = ethers.ZeroHash;
            
            console.log(`🚀 Step 5 - Calling giveFeedback: agentId=${agentId}, score=${scoreValue}, tag1="demo"`);
            
            // Llamar a giveFeedback
            let tx: ethers.ContractTransactionResponse;
            try {
                tx = await reputationContract.giveFeedback(
                    agentId,
                    scoreValue,
                    tag1Bytes,
                    tag2Bytes,
                    fileuriString,
                    filehashBytes,
                    feedbackAuthBytes
                );
            } catch (txError: any) {
                if (txError.code === 4001 || txError.message?.includes('rejected') || txError.message?.includes('denied')) {
                    setStatus('User rejected transaction');
                    return;
                }
                throw txError;
            }
            
            console.log(`📡 Step 5 - Transaction sent: ${tx.hash}`);
            setStatus(`Transaction sent! Waiting for confirmation... (${tx.hash})`);
            
            // Esperar confirmación
            const receipt = await tx.wait();
            
            if (receipt && receipt.status === 1) {
                // ========================================================================
                // Éxito - Limpiar formulario
                // ========================================================================
                setStatus('✅ Rating Submitted!');
                console.log('✅ Transaction confirmed:', receipt.transactionHash);
                
                // Reset form
                setRateeAgentId('');
                setScore(50);
                setComment('');
                
                // Limpiar mensaje después de 5 segundos
                setTimeout(() => {
                    setStatus('');
                }, 5000);
            } else {
                throw new Error('Transaction failed');
            }
            
        } catch (err: any) {
            // ========================================================================
            // Manejo de Errores
            // ========================================================================
            console.error('❌ Error submitting rating:', err);
            
            // Detectar si el usuario rechazó la firma o transacción
            if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('denied')) {
                setStatus('User rejected request');
            } else if (err.code === 'ACTION_REJECTED') {
                setStatus('User rejected transaction');
            } else if (err.reason) {
                // Error revertido del contrato
                setStatus(`Contract error: ${err.reason}`);
            } else {
                setStatus(`Error: ${err.message || 'Failed to submit rating'}`);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {!isConnected ? (
                <div className="p-4 bg-yellow-100 border-2 border-yellow-600">
                    <p className="font-bold">⚠️ Wallet Not Connected</p>
                    <p className="text-sm mt-1">Please connect your wallet using the "Connect Wallet" window to rate agents.</p>
                </div>
            ) : (
                <>
                    <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                        <p className="text-xs">
                            <strong>Connected:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                        </p>
                    </div>

                    <fieldset>
                        <legend>Check Reputation</legend>
                        <div className="field-row-stacked">
                            <label>Agent ID (Token ID):</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={targetAgentId}
                                    onChange={(e) => setTargetAgentId(e.target.value)}
                                    placeholder="1, 2, 3..."
                                    className="flex-1"
                                    min="1"
                                />
                                <button onClick={getReputation}>Check</button>
                            </div>
                        </div>
                        {reputation && (
                            <div className="mt-2 p-2 bg-white border-2 border-gray-400 inset-shadow">
                                <p><strong>Average Score:</strong> {reputation.avg}/100</p>
                                <p><strong>Rating Count:</strong> {reputation.count}</p>
                                <p><strong>Total Score:</strong> {reputation.total}</p>
                            </div>
                        )}
                    </fieldset>

                    <fieldset>
                        <legend>Rate Agent (ERC-8004 v1.0)</legend>
                        <div className="field-row-stacked">
                            <label>Agent ID (Token ID):</label>
                            <input
                                type="number"
                                value={rateeAgentId}
                                onChange={(e) => setRateeAgentId(e.target.value)}
                                placeholder="1, 2, 3..."
                                min="1"
                            />
                        </div>
                        <div className="field-row-stacked">
                            <label>Score (0 to 100):</label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(Number(e.target.value))}
                                min="0"
                                max="100"
                            />
                        </div>
                        <div className="field-row-stacked">
                            <label>Comment (optional):</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Your feedback about this agent..."
                                rows={3}
                            />
                        </div>
                        <div className="field-row mt-2">
                            <button onClick={handleSubmit}>Submit Rating</button>
                        </div>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 text-xs">
                            <p className="font-bold">⚠️ Note:</p>
                            <p>ERC-8004 v1.0 requires FeedbackAuth signature from the agent.</p>
                            <p>Currently using client signer as placeholder - in production, obtain signed FeedbackAuth from the agent.</p>
                        </div>
                    </fieldset>
                </>
            )}

            {status && (
                <div className="status-bar mt-2">
                    <p className="status-bar-field">{status}</p>
                </div>
            )}
        </div>
    );
}
