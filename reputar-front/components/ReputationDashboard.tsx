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
    const { provider, isConnected } = useWallet();

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

    const loadAgentsReputation = async () => {
        if (!isConnected || !provider) {
            setStatus('Using mock data (Wallet not connected)');
            setAgents(getMockAgents());
            return;
        }

        try {
            setLoading(true);
            setStatus('Loading agents...');

            const registryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
            const reputationContract = new ethers.Contract(REPUTATION_HUB_ADDRESS, REPUTATION_HUB_ABI, provider);

            // Get all registered agents
            const agentAddresses = await registryContract.getAllAgents();

            // If no agents found, use mock data
            if (agentAddresses.length === 0) {
                setAgents(getMockAgents());
                setStatus('Showing mock data (no agents registered)');
                setLoading(false);
                return;
            }

            // Fetch reputation for each agent
            const agentsData: AgentReputation[] = [];

            for (const address of agentAddresses) {
                try {
                    const [avg, count, total] = await reputationContract.getReputation(address);
                    const avgFormatted = (Number(avg) / 100).toFixed(2);

                    // Try to get agent metadata
                    let metadataURI = '';
                    try {
                        const agentInfo = await registryContract.getAgent(address);
                        metadataURI = agentInfo.metadataURI;
                    } catch (e) {
                        // Agent might not have metadata
                    }

                    agentsData.push({
                        address,
                        average: avgFormatted,
                        count: count.toString(),
                        total: total.toString(),
                        metadataURI
                    });
                } catch (err) {
                    console.error(`Error fetching reputation for ${address}:`, err);
                }
            }

            // Sort by average score (descending)
            agentsData.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

            setAgents(agentsData);
            setStatus(`Loaded ${agentsData.length} agents`);
        } catch (err: any) {
            setStatus(`Using mock data (Error: ${err.message})`);
            setAgents(getMockAgents());
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgentsReputation();
    }, [isConnected, provider]);

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
            <div className="flex justify-between items-center">
                <h3 className="font-bold">Agent Reputation Leaderboard</h3>
                <button onClick={loadAgentsReputation} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {agents.length === 0 && !loading ? (
                <div className="p-4 text-center bg-white border-2 border-gray-400 inset-shadow">
                    <p>No agents registered yet.</p>
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
                                        backgroundColor: index % 2 === 0 ? 'white' : '#f0f0f0',
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
