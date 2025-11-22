"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { ethers } from 'ethers';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import type { WalletState, WalletType, EthereumProvider } from '../types/wallet';

interface WalletContextType extends WalletState {
    connect: (walletType: WalletType) => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    // Use ref to store Coinbase Wallet SDK instance (initialized only on client)
    const coinbaseWalletRef = useRef<CoinbaseWalletSDK | null>(null);

    const [state, setState] = useState<WalletState>({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        provider: null,
        signer: null,
        walletType: null,
        error: null
    });

    // Initialize Coinbase Wallet SDK on client side only
    useEffect(() => {
        if (typeof window !== 'undefined' && !coinbaseWalletRef.current) {
            coinbaseWalletRef.current = new CoinbaseWalletSDK({
                appName: 'Reputar AI',
                appLogoUrl: '/ai-brain-logo.png'
            });
        }
    }, []);

    // Handle account changes
    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            // User disconnected
            disconnect();
        } else {
            setState(prev => ({
                ...prev,
                address: accounts[0]
            }));
        }
    }, []);

    // Handle chain changes
    const handleChainChanged = useCallback((chainId: string) => {
        const chainIdNumber = parseInt(chainId, 16);
        setState(prev => ({
            ...prev,
            chainId: chainIdNumber
        }));
        // Reload to avoid state inconsistencies
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }, []);

    // Connect to wallet
    const connect = useCallback(async (walletType: WalletType) => {
        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            let ethereum: EthereumProvider | undefined;

            if (walletType === 'metamask') {
                // Check for MetaMask
                if (window.ethereum?.isMetaMask) {
                    ethereum = window.ethereum;
                } else {
                    throw new Error('MetaMask not detected. Please install MetaMask extension.');
                }
            } else if (walletType === 'coinbase') {
                // Use Coinbase Wallet SDK
                if (!coinbaseWalletRef.current) {
                    throw new Error('Coinbase Wallet SDK not initialized');
                }
                ethereum = coinbaseWalletRef.current.makeWeb3Provider() as unknown as EthereumProvider;
            } else if (walletType === 'injected') {
                // Use any injected provider
                if (window.ethereum) {
                    ethereum = window.ethereum;
                } else {
                    throw new Error('No wallet detected. Please install a Web3 wallet.');
                }
            }

            if (!ethereum) {
                throw new Error('Failed to initialize wallet provider');
            }

            // Request account access
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get chain ID
            const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
            const chainIdNumber = parseInt(chainIdHex, 16);

            // Create ethers provider and signer
            const provider = new ethers.BrowserProvider(ethereum as any);
            const signer = await provider.getSigner();

            // Set up event listeners
            ethereum.on('accountsChanged', handleAccountsChanged);
            ethereum.on('chainChanged', handleChainChanged);

            setState({
                address: accounts[0],
                chainId: chainIdNumber,
                isConnected: true,
                isConnecting: false,
                provider,
                signer,
                walletType,
                error: null
            });

        } catch (error: any) {
            console.error('Wallet connection error:', error);
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message || 'Failed to connect wallet'
            }));
        }
    }, [handleAccountsChanged, handleChainChanged]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        // Remove event listeners
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        }

        setState({
            address: null,
            chainId: null,
            isConnected: false,
            isConnecting: false,
            provider: null,
            signer: null,
            walletType: null,
            error: null
        });
    }, [handleAccountsChanged, handleChainChanged]);

    // Check for existing connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        // Auto-reconnect
                        const walletType: WalletType = window.ethereum.isMetaMask
                            ? 'metamask'
                            : window.ethereum.isCoinbaseWallet
                                ? 'coinbase'
                                : 'injected';

                        await connect(walletType);
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                }
            }
        };

        checkConnection();
    }, [connect]);

    const value: WalletContextType = {
        ...state,
        connect,
        disconnect
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
