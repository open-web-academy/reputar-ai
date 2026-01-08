"use client";

import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { NETWORK_LIST, getNetworkName } from '../utils/networks';

/**
 * Componente selector de red estilo Windows 95
 * Permite cambiar entre diferentes redes blockchain
 */
export default function NetworkSelector() {
  const { currentNetworkId, switchNetwork } = useNetwork();

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChainId = parseInt(e.target.value, 10);
    if (!isNaN(newChainId)) {
      switchNetwork(newChainId);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <label
        style={{
          fontSize: '10px',
          fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
          color: '#000',
          marginRight: '2px',
        }}
      >
        Network:
      </label>
      <select
        value={currentNetworkId}
        onChange={handleNetworkChange}
        style={{
          fontFamily: '"MS Sans Serif", "Segoe UI", sans-serif',
          fontSize: '10px',
          padding: '2px 4px',
          backgroundColor: '#ffffff',
          border: '2px solid',
          borderTopColor: '#808080',
          borderLeftColor: '#808080',
          borderRightColor: '#ffffff',
          borderBottomColor: '#ffffff',
          color: '#000',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '140px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderTopColor = '#000000';
          e.currentTarget.style.borderLeftColor = '#000000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderTopColor = '#808080';
          e.currentTarget.style.borderLeftColor = '#808080';
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderTopColor = '#000000';
          e.currentTarget.style.borderLeftColor = '#000000';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderTopColor = '#808080';
          e.currentTarget.style.borderLeftColor = '#808080';
        }}
      >
        {NETWORK_LIST.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
    </div>
  );
}

