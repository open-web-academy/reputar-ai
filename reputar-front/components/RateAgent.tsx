import React, { useState } from 'react';
import { ethers } from 'ethers';
import { REPUTATION_HUB_ADDRESS, REPUTATION_HUB_ABI } from '../utils/contracts';

export default function RateAgent() {
    const [targetAgent, setTargetAgent] = useState('');
    const [reputation, setReputation] = useState<{ avg: string, count: string, total: string } | null>(null);
    const [ratee, setRatee] = useState('');
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState('');

    const getReputation = async () => {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(REPUTATION_HUB_ADDRESS, REPUTATION_HUB_ABI, provider);

            const [avg, count, total] = await contract.getReputation(targetAgent);
            // avg is scaled by 100
            const avgFormatted = (Number(avg) / 100).toFixed(2);
            setReputation({ avg: avgFormatted, count: count.toString(), total: total.toString() });
        } catch (err: any) {
            setStatus(`Error fetching: ${err.message}`);
        }
    };

    const handleRate = async () => {
        if (!window.ethereum) return;
        try {
            setStatus('Rating...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(REPUTATION_HUB_ADDRESS, REPUTATION_HUB_ABI, signer);

            const tx = await contract.rate(ratee, score);
            setStatus(`Tx sent: ${tx.hash}`);
            await tx.wait();
            setStatus('Success! Rated.');
        } catch (err: any) {
            setStatus(`Error rating: ${err.message}`);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <fieldset>
                <legend>Check Reputation</legend>
                <div className="field-row-stacked">
                    <label>Agent Address:</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={targetAgent}
                            onChange={(e) => setTargetAgent(e.target.value)}
                            placeholder="0x..."
                            className="flex-1"
                        />
                        <button onClick={getReputation}>Check</button>
                    </div>
                </div>
                {reputation && (
                    <div className="mt-2 p-2 bg-white border-2 border-gray-400 inset-shadow">
                        <p>Average: {reputation.avg}</p>
                        <p>Count: {reputation.count}</p>
                        <p>Total Score: {reputation.total}</p>
                    </div>
                )}
            </fieldset>

            <fieldset>
                <legend>Rate Agent</legend>
                <div className="field-row-stacked">
                    <label>Agent Address:</label>
                    <input
                        type="text"
                        value={ratee}
                        onChange={(e) => setRatee(e.target.value)}
                        placeholder="0x..."
                    />
                </div>
                <div className="field-row-stacked">
                    <label>Score (-100 to 100):</label>
                    <input
                        type="number"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        min="-100"
                        max="100"
                    />
                </div>
                <div className="field-row mt-2">
                    <button onClick={handleRate}>Submit Rating</button>
                </div>
            </fieldset>

            {status && (
                <div className="status-bar mt-2">
                    <p className="status-bar-field">{status}</p>
                </div>
            )}
        </div>
    );
}
