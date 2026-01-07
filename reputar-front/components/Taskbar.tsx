import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface TaskbarProps {
    onOpenRegister: () => void;
    onOpenDashboard: () => void;
    onOpenRateAgent: () => void;
    onOpenWallet: () => void;
}

export default function Taskbar({ onOpenRegister, onOpenDashboard, onOpenRateAgent, onOpenWallet }: TaskbarProps) {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [time, setTime] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const { address, isConnected, walletType, chainId, disconnect } = useWallet();
    const walletMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close wallet menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
                setIsWalletMenuOpen(false);
            }
        };

        if (isWalletMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isWalletMenuOpen]);

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getWalletIcon = () => {
        if (walletType === 'metamask') return '🦊';
        if (walletType === 'coinbase') return '🔵';
        return '🔌';
    };

    const getNetworkName = (chainId: number) => {
        const networks: { [key: number]: string } = {
            1: 'Ethereum',
            5: 'Goerli',
            11155111: 'Sepolia',
            137: 'Polygon',
            80001: 'Mumbai',
            8453: 'Base',
            84531: 'Base Goerli',
            84532: 'Base Sepolia',
            11155111: 'Ethereum Sepolia',
            421614: 'Arbitrum Sepolia',
            0xa516: 'Oasis Emerald',
            0x5afe: 'Oasis Sapphire'
        };
        return networks[chainId] || `Chain ${chainId}`;
    };

    const copyAddress = async () => {
        if (address) {
            try {
                await navigator.clipboard.writeText(address);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    // Switch network to Sepolia if not already there
    const switchToSepolia = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }]
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    // Add the chain if missing
                    await (window as any).ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia',
                            nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                            rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://1rpc.io/sepolia', 'https://rpc.sepolia.org'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                        }]
                    });
                } else {
                    console.error('Failed to switch network', switchError);
                }
            }
        }
    };

    // Warning button (appears when not on Sepolia)
    const sepoliaWarning = chainId && chainId !== 11155111 && (
        <button
            className="text-left px-2 py-1 bg-[#ffcccc] hover:bg-[#ff9999] flex items-center gap-2 text-xs"
            onClick={switchToSepolia}
        >
            ⚠️ Switch to Sepolia
        </button>
    );
    // Handle disconnect action
    const handleDisconnect = () => {
        disconnect();
        setIsWalletMenuOpen(false);
    };

    const handleOpenWallet = () => {
        onOpenWallet();
        setIsWalletMenuOpen(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[28px] bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 z-50 shadow-out">
            <div className="relative">
                <button
                    className={`font-bold px-2 py-1 flex items-center gap-1 ${isStartOpen ? 'active' : ''}`}
                    onClick={() => setIsStartOpen(!isStartOpen)}
                    style={{ minWidth: '60px' }}
                >
                    <img src="/ai-brain-logo.png" alt="AI Brain Logo" className="w-4 h-4" />
                    Start
                </button>

                {isStartOpen && (
                    <div className="absolute bottom-8 left-0 bg-[#c0c0c0] border-2 border-white border-r-gray-600 border-b-gray-600 p-1 min-w-[150px] shadow-out flex flex-col gap-1">
                        <div className="bg-[#000080] text-white px-2 py-4 font-bold mb-1 vertical-text side-bar">
                            Reputar 98
                        </div>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenDashboard(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-3.png" className="w-4 h-4" />
                            Reputation Hub
                        </button>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenRegister(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/users-1.png" className="w-4 h-4" />
                            Agent Register
                        </button>
                        <button className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2" onClick={() => { onOpenRateAgent(); setIsStartOpen(false); }}>
                            <img src="https://win98icons.alexmeub.com/icons/png/certificate_application-0.png" className="w-4 h-4" />
                            Submit Rating
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1"></div>

            {/* Wallet Status Indicator with Dropdown Menu */}
            <div className="relative" ref={walletMenuRef}>
                {isConnected && address ? (
                    <>
                        <button
                            className="border-2 border-gray-500 border-b-white border-r-white px-2 py-0.5 bg-[#c0c0c0] inset-shadow mr-1 hover:bg-gray-300 flex items-center gap-1 text-xs"
                            onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                            title={`Connected: ${address}\nNetwork: ${getNetworkName(chainId || 0)}`}
                        >
                            <span>{getWalletIcon()}</span>
                            <span className="font-mono">{shortenAddress(address)}</span>
                        </button>

                        {/* Wallet Dropdown Menu */}
                        {isWalletMenuOpen && (
                            <div className="absolute bottom-8 right-0 bg-[#c0c0c0] border-2 border-white border-r-gray-600 border-b-gray-600 p-1 min-w-[200px] shadow-out flex flex-col">
                                {/* Header */}
                                <div className="px-2 py-1 border-b border-gray-500 mb-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{getWalletIcon()}</span>
                                        <span className="font-bold text-xs capitalize">{walletType}</span>
                                    </div>
                                    <div className="text-xs font-mono bg-white border border-gray-400 px-1 py-0.5 break-all">
                                        {address}
                                    </div>
                                    <div className="text-xs mt-1 text-gray-600">
                                        Network: {getNetworkName(chainId || 0)}
                                    </div>
                                </div>
                                {sepoliaWarning}
                                {/* Menu Options */}
                                <button
                                    className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs"
                                    onClick={copyAddress}
                                >
                                    <span>📋</span>
                                    {copySuccess ? '✓ Copied!' : 'Copy Address'}
                                </button>

                                <button
                                    className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs"
                                    onClick={handleOpenWallet}
                                >
                                    <span>⚙️</span>
                                    Wallet Settings
                                </button>

                                <div className="border-t border-gray-500 my-1"></div>

                                <button
                                    className="text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-xs"
                                    onClick={handleDisconnect}
                                >
                                    <span>🔌</span>
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        className="border-2 border-gray-500 border-b-white border-r-white px-2 py-0.5 bg-[#c0c0c0] inset-shadow mr-1 hover:bg-gray-300 flex items-center gap-1 text-xs"
                        onClick={onOpenWallet}
                        title="Click to connect wallet"
                    >
                        <span>🔌</span>
                        <span>Not Connected</span>
                    </button>
                )}
            </div>

            <div className="border-2 border-gray-500 border-b-white border-r-white px-2 py-0.5 bg-[#c0c0c0] inset-shadow">
                {time}
            </div>
        </div>
    );
}
