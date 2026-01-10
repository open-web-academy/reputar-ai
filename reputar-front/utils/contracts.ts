// ============================================================================
// ERC-8004 v1.1 Official Implementation - Ethereum Sepolia (Jan 2026 Update)
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
// Contract Addresses (ERC-8004 v1.1)
// ============================================================================
export const IDENTITY_REGISTRY_ADDRESS = "0xaf8390aeeef89a2d60dcf57462c047804cfe4a5"; // Identity Registry (ERC-8004 v1.1)
export const REPUTATION_REGISTRY_ADDRESS = "0xef1f86681807e7f5ce6f7728e8a81e013c51be9f"; // Reputation Registry (ERC-8004 v1.1)
export const VALIDATION_REGISTRY_ADDRESS = "0x662b40A526cb4017d947e71eAF6753BF3eeE66d8"; // Validation Registry (ERC-8004 v1.1)

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
// Reputation Registry ABI (ERC-8004 v1.1)
// ============================================================================
export const REPUTATION_REGISTRY_ABI = [
  // Get reputation summary (ERC-8004 v1.1 - uses string for tags)
  "function getSummary(uint256 agentId, address[] calldata clientAddresses, string tag1, string tag2) external view returns (uint64 count, uint8 averageScore)",
  // Submit feedback/rating (ERC-8004 v1.1 - simplified, no feedbackAuth required)
  "function giveFeedback(uint256 agentId, uint8 score, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external",
  // Read all feedback for an agent (ERC-8004 v1.1 - complete signature with all fields)
  "function readAllFeedback(uint256 agentId, address[] calldata clientAddresses, string tag1, string tag2, bool includeRevoked) external view returns (address[] clients, uint64[] indexes, uint8[] scores, string[] tag1s, string[] tag2s, string[] endpoints, bool[] revokedStatuses)",
  // Events
  "event FeedbackGiven(uint256 indexed agentId, address indexed rater, uint8 score, string tag1, string tag2, string endpoint)",
  "event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, uint8 score, string indexed tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)"
];

// Alias for backward compatibility
export const REPUTATION_HUB_ABI = REPUTATION_REGISTRY_ABI;