export const AGENT_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with deployed address
export const REPUTATION_HUB_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with deployed address

export const AGENT_REGISTRY_ABI = [
  "function registerAgent(string calldata metadataURI, bytes32 pubKeyHash) external",
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
