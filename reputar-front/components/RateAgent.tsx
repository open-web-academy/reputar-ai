import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getAgentReputation } from '../utils/reputation';
import SubmitRatingForm from './SubmitRatingForm';

export default function RateAgent() {
    const [targetAgentId, setTargetAgentId] = useState('');
    const [reputation, setReputation] = useState<{ avg: number, count: number, total: number } | null>(null);
    const [status, setStatus] = useState('');
    const { isConnected, provider, address } = useWallet();

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

    const handleRatingSuccess = () => {
        // Callback cuando la calificación es exitosa
        // Opcionalmente, podemos refrescar la reputación si el targetAgentId coincide
        if (targetAgentId) {
            getReputation();
        }
    };

    return (
        <div className="flex flex-col" style={{ gap: '8px', padding: '4px' }}>
            {!isConnected ? (
                <div className="p-4 bg-yellow-100 border-2 border-yellow-600" style={{ marginBottom: '8px' }}>
                    <p className="font-bold">⚠️ Wallet Not Connected</p>
                    <p className="text-sm mt-1">Please connect your wallet using the "Connect Wallet" window to rate agents.</p>
                </div>
            ) : (
                <>
                    <div className="p-2 bg-white border-2 border-gray-400 inset-shadow" style={{ marginBottom: '8px' }}>
                        <p className="text-xs">
                            <strong>Connected:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                        </p>
                    </div>

                    <fieldset style={{ marginBottom: '8px' }}>
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

                    <SubmitRatingForm 
                        agentId={targetAgentId}
                        onSuccess={handleRatingSuccess}
                    />
                </>
            )}

            {status && (
                <div className="status-bar" style={{ marginTop: '8px' }}>
                    <p className="status-bar-field">{status}</p>
                </div>
            )}
        </div>
    );
}
