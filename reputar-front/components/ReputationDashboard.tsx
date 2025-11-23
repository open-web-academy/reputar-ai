import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { REPUTATION_HUB_ADDRESS, REPUTATION_HUB_ABI, AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI } from '../utils/contracts';
import { useWallet } from '../contexts/WalletContext';

interface AgentReputation {
    address: string;
    average: string;
    count: string;
    total: string;
    metadataURI?: string;
}

export default function ReputationDashboard() {
    const [agents, setAgents] = useState<AgentReputation[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [lookupAddress, setLookupAddress] = useState('');
    const { provider, isConnected, chainId, address: userAddress } = useWallet();
    const BASE_SEPOLIA_CHAIN_ID = 84532;

    // Mock data for demonstration
    const getMockAgents = (): AgentReputation[] => {
        return [
            {
                address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
                average: '85.50',
                count: '24',
                total: '2052',
                metadataURI: 'ipfs://QmX...AI-Trading-Bot'
            },
            {
                address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
                average: '72.33',
                count: '18',
                total: '1302',
                metadataURI: 'ipfs://QmY...Data-Analyzer'
            },
            {
                address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
                average: '45.75',
                count: '12',
                total: '549',
                metadataURI: 'ipfs://QmZ...Content-Generator'
            },
            {
                address: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
                average: '12.50',
                count: '8',
                total: '100',
                metadataURI: 'ipfs://QmA...Research-Assistant'
            },
            {
                address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
                average: '-15.67',
                count: '6',
                total: '-94',
                metadataURI: 'ipfs://QmB...Spam-Bot'
            }
        ];
    };

    const switchNetwork = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x14a34' }], // 84532 in hex
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x14a34',
                                chainName: 'Base Sepolia',
                                rpcUrls: ['https://sepolia.base.org'],
                                nativeCurrency: {
                                    name: 'Ether',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                blockExplorerUrls: ['https://sepolia.basescan.org'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error(addError);
                }
            }
            console.error(switchError);
        }
    };

    const checkAgent = async (addressToCheck: string) => {
        if (!provider) return null;

        try {
            const registryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, [
                "function balanceOf(address owner) view returns (uint256)",
                "function tokenURI(uint256 tokenId) view returns (string)"
            ], provider);

            // Check if address holds an agent NFT (assuming 1 agent = 1 NFT per address model, or at least they own one)
            const balance = await registryContract.balanceOf(addressToCheck);

            if (balance > 0) {
                // It's an agent!
                // Mock reputation for now
                return {
                    address: addressToCheck,
                    average: '0.00',
                    count: '0',
                    total: '0',
                    metadataURI: 'Agent Detected (Metadata TBD)'
                };
            }
        } catch (e) {
            console.error("Error checking agent:", e);
        }
        return null;
    };

    const loadAgentsReputation = async () => {
        if (!isConnected || !provider) {
            setStatus('Using mock data (Wallet not connected)');
            setAgents(getMockAgents());
            return;
        }

        if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
            setStatus('Wrong Network: Please switch to Base Sepolia');
            setAgents(getMockAgents());
            return;
        }

        setLoading(true);
        setStatus('Loading...');

        try {
            const loadedAgents: AgentReputation[] = [];

            // 1. Check if current user is an agent
            if (userAddress) {
                const myAgent = await checkAgent(userAddress);
                if (myAgent) {
                    loadedAgents.push({ ...myAgent, metadataURI: 'Your Agent' });
                }
            }

            // 2. Add mock agents for demo purposes (since we can't list all real ones yet)
            const mocks = getMockAgents();
            // Filter out duplicates if any
            const uniqueMocks = mocks.filter(m => m.address.toLowerCase() !== userAddress?.toLowerCase());

            setAgents([...loadedAgents, ...uniqueMocks]);
            setStatus(`Loaded ${loadedAgents.length > 0 ? 'your agent & ' : ''}demo data`);

        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
            setAgents(getMockAgents());
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async () => {
        if (!ethers.isAddress(lookupAddress)) {
            setStatus('Invalid address');
            return;
        }
        setLoading(true);
        const agent = await checkAgent(lookupAddress);
        if (agent) {
            setAgents(prev => {
                // Remove if exists then add to top
                const filtered = prev.filter(a => a.address.toLowerCase() !== lookupAddress.toLowerCase());
                return [agent, ...filtered];
            });
            setStatus(`Found agent: ${lookupAddress.slice(0, 6)}...`);
        } else {
            setStatus('Address is not a registered agent');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAgentsReputation();
    }, [isConnected, provider, chainId, userAddress]);

    const getScoreColor = (avg: string) => {
        const score = parseFloat(avg);
        if (score >= 50) return '#00aa00';
        if (score >= 0) return '#0000aa';
        if (score >= -50) return '#aa5500';
        return '#aa0000';
    };

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold">Agent Reputation Leaderboard</h3>
                    <div className="flex gap-2">
                        {isConnected && chainId !== BASE_SEPOLIA_CHAIN_ID && (
                            <button onClick={switchNetwork} className="bg-red-600 text-white hover:bg-red-700">
                                Switch to Base Sepolia
                            </button>
                        )}
                        <button onClick={loadAgentsReputation} disabled={loading}>
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Check agent address..."
                        className="flex-1 px-2"
                        value={lookupAddress}
                        onChange={(e) => setLookupAddress(e.target.value)}
                    />
                    <button onClick={handleLookup} disabled={loading}>Lookup</button>
                </div>
            </div>

            {agents.length === 0 && !loading ? (
                <div className="p-4 text-center bg-white border-2 border-gray-400 inset-shadow">
                    <p>No agents found.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto bg-white border-2 border-gray-400 inset-shadow">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#000080', color: 'white' }}>
                                <th className="p-2 text-left" style={{ borderRight: '1px solid #c0c0c0' }}>Rank</th>
                                <th className="p-2 text-left" style={{ borderRight: '1px solid #c0c0c0' }}>Agent</th>
                                <th className="p-2 text-center" style={{ borderRight: '1px solid #c0c0c0' }}>Avg Score</th>
                                <th className="p-2 text-center" style={{ borderRight: '1px solid #c0c0c0' }}>Ratings</th>
                                <th className="p-2 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map((agent, index) => (
                                <tr
                                    key={agent.address}
                                    style={{
                                        backgroundColor: agent.address.toLowerCase() === userAddress?.toLowerCase() ? '#e0e0ff' : (index % 2 === 0 ? 'white' : '#f0f0f0'),
                                        borderBottom: '1px solid #c0c0c0'
                                    }}
                                >
                                    <td className="p-2" style={{ borderRight: '1px solid #c0c0c0' }}>
                                        <strong>#{index + 1}</strong>
                                    </td>
                                    <td className="p-2" style={{ borderRight: '1px solid #c0c0c0' }}>
                                        <div className="flex flex-col">
                                            <code className="text-xs">{shortenAddress(agent.address)}</code>
                                            {agent.metadataURI && (
                                                <span className="text-xs text-gray-600 truncate max-w-[200px]">
                                                    {agent.metadataURI}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        className="p-2 text-center font-bold"
                                        style={{
                                            borderRight: '1px solid #c0c0c0',
                                            color: getScoreColor(agent.average)
                                        }}
                                    >
                                        {agent.average}
                                    </td>
                                    <td className="p-2 text-center" style={{ borderRight: '1px solid #c0c0c0' }}>
                                        {agent.count}
                                    </td>
                                    <td className="p-2 text-center">
                                        {agent.total}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {status && (
                <div className="status-bar">
                    <p className="status-bar-field">{status}</p>
                </div>
            )}
        </div>
    );
}
