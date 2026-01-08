"use client";

import React from 'react';
import { useFetchAgents } from '../hooks/useFetchAgents';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkName } from '../utils/networks';
import AgentCard from './AgentCard';

export default function AgentList() {
  const { agents, loading, error, refetch } = useFetchAgents();
  const { isConnected, chainId } = useWallet();
  const { currentNetworkId } = useNetwork();
  const networkName = getNetworkName(currentNetworkId);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div 
        className="flex justify-between items-center"
        style={{ flexShrink: 0, marginBottom: '8px' }}
      >
        <h3 className="font-bold">ERC-8004 Trustless Agents Registry - {networkName}</h3>
        <div className="flex gap-2">
          <button onClick={refetch} disabled={loading} className="px-2 py-1 text-sm">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border-2 border-red-600" style={{ flexShrink: 0, marginBottom: '8px' }}>
          <p className="font-bold text-red-800">⚠️ Error</p>
          <p className="text-sm mt-1 text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center bg-white border-2 border-gray-400 inset-shadow" style={{ flexShrink: 0 }}>
          <p>Loading agents from blockchain...</p>
          <p className="text-xs mt-2 text-gray-600">This may take a moment</p>
        </div>
      )}

      {!loading && !error && agents.length === 0 && (
        <div className="p-8 text-center bg-white border-2 border-gray-400 inset-shadow" style={{ flexShrink: 0 }}>
          <p>No agents found in the registry.</p>
        </div>
      )}

      {!loading && !error && agents.length > 0 && (
        <>
          <div className="p-2 bg-white border-2 border-gray-400 inset-shadow" style={{ flexShrink: 0, marginBottom: '8px' }}>
            <p className="text-xs">
              <strong>Total Agents:</strong> {agents.length}
            </p>
          </div>

          <div 
            className="bg-white border-2 border-gray-400 inset-shadow win95-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              maxHeight: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px',
              paddingBottom: '80px',
              boxSizing: 'border-box',
            }}
          >
            <div 
              className="agent-grid-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
                width: '100%',
                minHeight: 'min-content',
                alignItems: 'start',
              }}
            >
              {[...agents].reverse().map((agent) => (
                <AgentCard key={agent.tokenId} agent={agent} />
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !error && (
        <div className="status-bar" style={{ flexShrink: 0, marginTop: '8px' }}>
          <p className="status-bar-field">
            {agents.length > 0
              ? `Loaded ${agents.length} agent${agents.length !== 1 ? 's' : ''} from ${networkName}`
              : 'Ready'}
          </p>
        </div>
      )}
    </div>
  );
}

