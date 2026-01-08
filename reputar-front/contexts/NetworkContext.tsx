"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_NETWORK_ID } from '../utils/networks';

interface NetworkContextType {
  currentNetworkId: number;
  switchNetwork: (chainId: number) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const STORAGE_KEY = 'reputar-ai-selected-network';

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage o usar el default
  const [currentNetworkId, setCurrentNetworkId] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_NETWORK_ID;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading network from localStorage:', error);
    }
    
    return DEFAULT_NETWORK_ID;
  });

  // Función para cambiar de red
  const switchNetwork = (chainId: number) => {
    setCurrentNetworkId(chainId);
    
    // Persistir en localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, chainId.toString());
      } catch (error) {
        console.warn('Error saving network to localStorage:', error);
      }
    }
  };

  const value: NetworkContextType = {
    currentNetworkId,
    switchNetwork
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

