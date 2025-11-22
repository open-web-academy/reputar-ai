import { ethers } from 'ethers';

export interface EthereumProvider {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
    selectedAddress?: string;
    chainId?: string;
}

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

export type WalletType = 'metamask' | 'coinbase' | 'injected';

export interface WalletState {
    address: string | null;
    chainId: number | null;
    isConnected: boolean;
    isConnecting: boolean;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
    walletType: WalletType | null;
    error: string | null;
}
