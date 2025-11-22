import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from '../utils/contracts';
import { useWallet } from '../contexts/WalletContext';

export default function AgentRegister() {
    const [metadataURI, setMetadataURI] = useState('');
    const [status, setStatus] = useState('');
    const { isConnected, signer, address } = useWallet();

    const handleRegister = async () => {
        if (!isConnected || !signer) {
            setStatus('Error: Please connect your wallet first');
            return;
        }

        try {
            setStatus('Preparing transaction...');
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
            {!isConnected ? (
                <div className="p-4 bg-yellow-100 border-2 border-yellow-600">
                    <p className="font-bold">⚠️ Wallet Not Connected</p>
                    <p className="text-sm mt-1">Please connect your wallet using the "Connect Wallet" window to register an agent.</p>
                </div>
            ) : (
                <>
                    <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                        <p className="text-xs">
                            <strong>Connected:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
                        </p>
                    </div>

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
