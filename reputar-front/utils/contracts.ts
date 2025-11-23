export const AGENT_REGISTRY_ADDRESS = "0x7177a6867296406881E20d6647232314736Dd09A"; // Identity Registry on Base Sepolia
// export const REPUTATION_HUB_ADDRESS = "0x..."; // Reputation Registry on Base Sepolia (TBD)
// Using a placeholder or the same address if it handles both (unlikely, but prevents crash for now)
export const REPUTATION_HUB_ADDRESS = "0x0000000000000000000000000000000000000000";
export const VALIDATION_REGISTRY_ADDRESS = "0x03eCA4d903Adc96440328C2E3a18B71EB0AFa60D"; // TEE Registry on Base Sepolia

export const AGENT_REGISTRY_ABI = [
  "function register(string calldata metadataURI) external",
  "function isAgent(address agent) public view returns (bool)",
  "function getAllAgents() external view returns (address[] memory)",
  "function getAgent(address agent) external view returns (tuple(address agentAddress, string metadataURI, bytes32 pubKeyHash, uint256 registeredAt, bool active))",
  "event AgentRegistered(address indexed agent, string metadataURI, bytes32 pubKeyHash)"
];

export const REPUTATION_HUB_ABI = [
  "function rate(address ratee, int32 score) external",
  "function getReputation(address agent) external view returns (int256 average, uint256 count, int256 total)",
  "event Rated(address indexed rater, address indexed ratee, int32 previousScore, int32 newScore)"
];
