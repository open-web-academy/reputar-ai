// ============================================================================
// ERC-8004 v1.0 Official Implementation - Ethereum Sepolia
// ============================================================================

// Network Configuration
export const NETWORK_CONFIG = {
  name: 'Ethereum Sepolia',
  chainId: 11155111,
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', // Stable public RPC (mejor para CORS)
  blockExplorer: 'https://sepolia.etherscan.io'
};

export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;
export const ETHEREUM_SEPOLIA_RPC_URL = NETWORK_CONFIG.rpcUrl;
export const ETHEREUM_SEPOLIA_BLOCK_EXPLORER = NETWORK_CONFIG.blockExplorer;

// Legacy aliases for backward compatibility
export const BASE_SEPOLIA_CHAIN_ID = ETHEREUM_SEPOLIA_CHAIN_ID; // Alias
export const BASE_SEPOLIA_RPC_URL = ETHEREUM_SEPOLIA_RPC_URL; // Alias
export const BASE_SEPOLIA_BLOCK_EXPLORER = ETHEREUM_SEPOLIA_BLOCK_EXPLORER; // Alias
export const ARBITRUM_SEPOLIA_CHAIN_ID = ETHEREUM_SEPOLIA_CHAIN_ID; // Alias
export const ARBITRUM_SEPOLIA_RPC_URL = ETHEREUM_SEPOLIA_RPC_URL; // Alias

// ============================================================================
// Contract Addresses (ERC-8004 v1.0)
// ============================================================================
export const IDENTITY_REGISTRY_ADDRESS = "0x7177a6867296406881E20d6647232314736Dd09A"; // Identity Registry (ERC-8004 v1.0)
export const REPUTATION_REGISTRY_ADDRESS = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322"; // Reputation Registry (ERC-8004 v1.0)
export const VALIDATION_REGISTRY_ADDRESS = "0x662b40A526cb4017d947e71eAF6753BF3eeE66d8"; // Validation Registry (ERC-8004 v1.0)

// Legacy addresses (aliases for backward compatibility)
export const AGENT_REGISTRY_ADDRESS = IDENTITY_REGISTRY_ADDRESS;
export const REPUTATION_HUB_ADDRESS = REPUTATION_REGISTRY_ADDRESS;
export const ERC8004_REGISTRY_ADDRESS = IDENTITY_REGISTRY_ADDRESS;

// ============================================================================
// Identity Registry ABI (ERC-8004 v1.0)
// ============================================================================
export const IDENTITY_REGISTRY_ABI = [
  // ERC-721 Standard Functions
  "function tokenURI(uint256 agentId) external view returns (string)",
  "function ownerOf(uint256 agentId) external view returns (address)",
  // ERC-721 Enumerable (if supported)
  "function totalSupply() external view returns (uint256)",
  "function tokenByIndex(uint256 index) external view returns (uint256)",
  // ERC-8004 v1.0 Specific Functions
  "function totalAgents() external view returns (uint256 count)",
  // ERC-165
  "function supportsInterface(bytes4 interfaceId) external view returns (bool)",
  // Events
  "event Registered(uint256 indexed agentId, address indexed owner, string metadataURI)"
];

// Alias for backward compatibility
export const ERC8004_REGISTRY_ABI = IDENTITY_REGISTRY_ABI;
export const AGENT_REGISTRY_ABI = IDENTITY_REGISTRY_ABI;

// ============================================================================
// Reputation Registry ABI (ERC-8004 v1.0)
// ============================================================================
export const REPUTATION_REGISTRY_ABI = [
  // Get reputation summary
  "function getSummary(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2) external view returns (uint64 count, uint8 averageScore)",
  // Submit feedback/rating (requires FeedbackAuth signature)
  "function giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string fileuri, bytes32 filehash, bytes feedbackAuth) external",
  // Read all feedback for an agent
  "function readAllFeedback(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2, bool includeRevoked) external view returns (address[] clients, uint8[] scores, bytes32[] tag1s, bytes32[] tag2s)",
  // Events
  "event FeedbackGiven(uint256 indexed agentId, address indexed rater, uint8 score, bytes32 tag1, bytes32 tag2, string fileuri)",
  "event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint8 score, bytes32 indexed tag1, bytes32 tag2, string fileuri, bytes32 filehash)"
];

// Alias for backward compatibility
export const REPUTATION_HUB_ABI = REPUTATION_REGISTRY_ABI;