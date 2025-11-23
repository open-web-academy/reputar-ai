import { ChaosChainSDK, NetworkConfig, AgentRole } from '@chaoschain/sdk';

/**
 * Initialize the ChaosChain SDK.
 * Note: This requires a private key, so it is primarily for server-side agent logic
 * or environments where the private key is securely managed.
 * 
 * For client-side DApp interactions, we continue to use ethers.js with the injected provider.
 */
export const initSDK = (privateKey?: string) => {
    if (!privateKey) {
        console.warn("No private key provided for ChaosChain SDK. Read-only mode or limited functionality.");
    }

    return new ChaosChainSDK({
        agentName: 'ReputarFrontend',
        agentDomain: 'reputar.ai',
        agentRole: AgentRole.CLIENT, // Acting as a client/viewer
        network: 'sepolia', // Using string 'sepolia' as per docs or NetworkConfig.SEPOLIA if available
        privateKey: privateKey || undefined,
        enablePayments: true,
        enableStorage: true
    });
};

// Export configuration for reference
export const CHAOS_CHAIN_CONFIG = {
    network: 'base-sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org'
};
