"use client";

import React, { useMemo } from 'react';
import { useFetchAgents } from '../hooks/useFetchAgents';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkName } from '../utils/networks';
import AgentCard from './AgentCard';
import NetworkSelector from './NetworkSelector';

export default function ReputationDashboard() {
  const { agents, loading, error, refetch } = useFetchAgents();
  const { currentNetworkId } = useNetwork();
  const networkName = getNetworkName(currentNetworkId);

  const sortedAgents = useMemo(() => {
    const sorted = [...agents].sort((a, b) => {
      const scoreA = a.reputation !== null && a.reputation !== undefined 
        ? a.reputation 
        : (a.reputationScore ?? 0);
      const scoreB = b.reputation !== null && b.reputation !== undefined 
        ? b.reputation 
        : (b.reputationScore ?? 0);
      
      if (scoreA === scoreB) return 0;
      if (scoreA === null || scoreA === undefined || scoreA === 0) return 1;
      if (scoreB === null || scoreB === undefined || scoreB === 0) return -1;
      
      return scoreB - scoreA;
    });
    
    return sorted;
  }, [agents]);

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
        <h3 className="font-bold">Agent Reputation Leaderboard (Multi-Chain)</h3>
        <div className="flex gap-2 items-center">
          <NetworkSelector />
          <button 
            onClick={refetch} 
            disabled={loading}
            style={{
              fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: '#c0c0c0',
              border: '2px outset #c0c0c0',
              borderTopColor: '#ffffff',
              borderLeftColor: '#ffffff',
              borderRightColor: '#808080',
              borderBottomColor: '#808080',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              color: '#000',
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.borderStyle = 'inset';
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                e.currentTarget.style.borderStyle = 'outset';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.borderStyle = 'outset';
              }
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div 
          className="p-4 bg-red-100 border-2 border-red-600" 
          style={{ flexShrink: 0, marginBottom: '8px' }}
        >
          <p className="font-bold text-red-800">⚠️ Error</p>
          <p className="text-sm mt-1 text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div 
          className="p-8 text-center bg-white border-2 border-gray-400 inset-shadow" 
          style={{ flexShrink: 0 }}
        >
          <p>Loading agents from blockchain...</p>
          <p className="text-xs mt-2 text-gray-600">This may take a moment</p>
        </div>
      )}

      {!loading && !error && sortedAgents.length === 0 && (
        <div 
          className="p-8 text-center bg-white border-2 border-gray-400 inset-shadow" 
          style={{ flexShrink: 0 }}
        >
          <p>No agents found in the registry.</p>
        </div>
      )}

      {!loading && !error && sortedAgents.length > 0 && (
        <>
          <div 
            className="p-2 bg-white border-2 border-gray-400 inset-shadow" 
            style={{ flexShrink: 0, marginBottom: '8px' }}
          >
            <p className="text-xs">
              <strong>Total Agents:</strong> {sortedAgents.length} | <strong>Network:</strong> {networkName}
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
              {sortedAgents.map((agent) => (
                <AgentCard key={agent.tokenId} agent={agent} />
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !error && (
        <div className="status-bar" style={{ flexShrink: 0, marginTop: '8px' }}>
          <p className="status-bar-field">
            {sortedAgents.length > 0
              ? `Loaded ${sortedAgents.length} agent${sortedAgents.length !== 1 ? 's' : ''} from ${networkName} (sorted by reputation)`
              : 'Ready'}
          </p>
        </div>
      )}
    </div>
  );
}
