import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from '../utils/contracts';

export default function AgentRegister() {
    const [metadataURI, setMetadataURI] = useState('');
    const [status, setStatus] = useState('');

    const handleRegister = async () => {
        if (!window.ethereum) {
            setStatus('Error: No wallet found');
            return;
        }

        try {
            setStatus('Connecting...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, signer);

            setStatus('Sending transaction...');
            // Using a dummy hash for pubKeyHash as it's optional/example
            const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("dummy"));

            const tx = await contract.registerAgent(metadataURI, dummyHash);
            setStatus(`Tx sent: ${tx.hash}`);

            await tx.wait();
            setStatus('Success! Agent registered.');
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.message || err}`);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="field-row-stacked">
                <label htmlFor="metadata">Metadata URI:</label>
                <input
                    id="metadata"
                    type="text"
                    value={metadataURI}
                    onChange={(e) => setMetadataURI(e.target.value)}
                    placeholder="ipfs://..."
                />
            </div>

            <div className="field-row">
                <button onClick={handleRegister}>Register Agent</button>
            </div>

            {status && (
                <div className="status-bar mt-2">
                    <p className="status-bar-field">{status}</p>
                </div>
            )}
        </div>
    );
}
