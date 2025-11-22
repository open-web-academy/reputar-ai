import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import type { WalletType } from '../types/wallet';

interface WalletConnectProps {
    onConnectionSuccess?: () => void;
}

export default function WalletConnect({ onConnectionSuccess }: WalletConnectProps) {
    const { address, chainId, isConnected, isConnecting, walletType, error, connect, disconnect } = useWallet();
    const [showWalletOptions, setShowWalletOptions] = useState(false);

    const handleConnect = async (type: WalletType) => {
        await connect(type);
        setShowWalletOptions(false);
        // Auto-close window after successful connection
        if (onConnectionSuccess) {
            setTimeout(() => {
                onConnectionSuccess();
            }, 500); // Small delay to show success state
        }
    };

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getNetworkName = (chainId: number) => {
        const networks: { [key: number]: string } = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            137: 'Polygon',
            80001: 'Mumbai Testnet',
            8453: 'Base',
            84531: 'Base Goerli',
            84532: 'Base Sepolia'
        };
        return networks[chainId] || `Chain ID: ${chainId}`;
    };

    if (isConnected && address) {
        return (
            <div className="flex flex-col gap-4">
                <fieldset>
                    <legend>Wallet Connected</legend>
                    <div className="field-row-stacked">
                        <label>Address:</label>
                        <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                            <code className="text-xs">{shortenAddress(address)}</code>
                        </div>
                    </div>
                    <div className="field-row-stacked mt-2">
                        <label>Network:</label>
                        <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                            <span className="text-xs">{chainId ? getNetworkName(chainId) : 'Unknown'}</span>
                        </div>
                    </div>
                    <div className="field-row-stacked mt-2">
                        <label>Wallet Type:</label>
                        <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                            <span className="text-xs capitalize">{walletType}</span>
                        </div>
                    </div>
                </fieldset>

                <div className="field-row">
                    <button onClick={disconnect}>Disconnect Wallet</button>
                </div>

                <div className="p-2 bg-white border-2 border-gray-400 inset-shadow">
                    <p className="text-xs">
                        ✅ Your wallet is connected. You can now register agents, submit ratings, and view the reputation leaderboard.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {!showWalletOptions ? (
                <>
                    <div className="p-4 bg-white border-2 border-gray-400 inset-shadow">
                        <p className="mb-2">Connect your Web3 wallet to interact with the Reputar AI platform.</p>
                        <p className="text-xs text-gray-600">
                            You'll need a wallet to register agents, submit ratings, and view reputation data on-chain.
                        </p>
                    </div>

                    <div className="field-row">
                        <button
                            onClick={() => setShowWalletOptions(true)}
                            disabled={isConnecting}
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    </div>
                </>
            ) : (
                <fieldset>
                    <legend>Select Wallet</legend>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleConnect('metamask')}
                            disabled={isConnecting}
                            className="flex items-center gap-2 justify-start"
                        >
                            🦊 MetaMask
                        </button>

                        <button
                            onClick={() => handleConnect('coinbase')}
                            disabled={isConnecting}
                            className="flex items-center gap-2 justify-start"
                        >
                            🔵 Coinbase Wallet
                        </button>

                        <button
                            onClick={() => handleConnect('injected')}
                            disabled={isConnecting}
                            className="flex items-center gap-2 justify-start"
                        >
                            🔌 Other Wallet
                        </button>

                        <button
                            onClick={() => setShowWalletOptions(false)}
                            disabled={isConnecting}
                        >
                            Cancel
                        </button>
                    </div>
                </fieldset>
            )}

            {error && (
                <div className="status-bar">
                    <p className="status-bar-field" style={{ color: '#aa0000' }}>
                        ❌ {error}
                    </p>
                </div>
            )}

            {isConnecting && (
                <div className="status-bar">
                    <p className="status-bar-field">
                        ⏳ Connecting to wallet...
                    </p>
                </div>
            )}
        </div>
    );
}
