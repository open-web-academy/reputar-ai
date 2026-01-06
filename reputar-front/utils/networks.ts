// ============================================================================
// Multi-Chain Network Configuration
// ============================================================================

export interface NetworkConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  identityRegistry: string;
  reputationRegistry: string;
  deploymentBlock?: number;
}

/**
 * Configuración de redes soportadas
 * Las direcciones de los contratos son las mismas para todas las redes
 */
export const NETWORKS: Record<number, NetworkConfig> = {
  11155111: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    deploymentBlock: 6500000
  },
  
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.basescan.org',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    deploymentBlock: 16000000
  },

  11155420: {
    id: 11155420,
    name: 'OP Sepolia',
    rpcUrl: 'https://optimism-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia-optimism.etherscan.io',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    deploymentBlock: 17000000
  },

  919: {
    id: 919,
    name: 'Mode Testnet',
    rpcUrl: 'https://sepolia.mode.network',
    blockExplorer: 'https://sepolia.explorer.mode.network',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    deploymentBlock: 15000000
  },

  16602: {
    id: 16602,
    name: '0G Testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    blockExplorer: 'https://testnet.0g.ai',
    identityRegistry: '0x7177a6867296406881E20d6647232314736Dd09A',
    reputationRegistry: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
    deploymentBlock: 1
  }
};

/**
 * Red por defecto (Ethereum Sepolia)
 */
export const DEFAULT_NETWORK_ID = 11155111;

/**
 * Obtiene la configuración de una red por su ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORKS[chainId];
}

/**
 * Obtiene el nombre de una red por su ID
 */
export function getNetworkName(chainId: number): string {
  return NETWORKS[chainId]?.name || `Chain ${chainId}`;
}

/**
 * Obtiene la URL del RPC de una red por su ID
 */
export function getNetworkRpcUrl(chainId: number): string | undefined {
  return NETWORKS[chainId]?.rpcUrl;
}

/**
 * Obtiene el block explorer de una red por su ID
 */
export function getNetworkBlockExplorer(chainId: number): string | undefined {
  return NETWORKS[chainId]?.blockExplorer;
}

/**
 * Obtiene la dirección del Identity Registry de una red por su ID
 */
export function getNetworkIdentityRegistry(chainId: number): string | undefined {
  return NETWORKS[chainId]?.identityRegistry;
}

/**
 * Obtiene la dirección del Reputation Registry de una red por su ID
 */
export function getNetworkReputationRegistry(chainId: number): string | undefined {
  return NETWORKS[chainId]?.reputationRegistry;
}

export function getNetworkDeploymentBlock(chainId: number): number {
  return NETWORKS[chainId]?.deploymentBlock || 0;
}

/**
 * Lista de todas las redes disponibles (para selectores)
 */
export const NETWORK_LIST: NetworkConfig[] = Object.values(NETWORKS);

