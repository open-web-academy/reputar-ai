# Smart Contracts 📜

Solidity smart contracts for the Reputar AI decentralized reputation system.

## 📋 Overview

This directory contains two main smart contracts that power the Reputar AI platform:

1. **AgentRegistry.sol** - Manages agent registration and metadata
2. **ReputationHub.sol** - Handles reputation scoring and rating system

## 🔐 Contracts

### AgentRegistry.sol

The AgentRegistry contract manages the registration and lifecycle of AI agents on-chain.

#### Features
- ✅ Register new agents with metadata URI and public key hash
- ✅ Update agent information
- ✅ Activate/deactivate agents
- ✅ Query agent status and information
- ✅ List all registered agents

#### Key Functions

```solidity
// Register a new agent
function registerAgent(string calldata metadataURI, bytes32 pubKeyHash) external

// Update agent metadata
function updateAgent(string calldata metadataURI, bytes32 pubKeyHash) external

// Set agent active status
function setAgentActive(bool active) external

// Check if address is an active agent
function isAgent(address agent) public view returns (bool)

// Get agent information
function getAgent(address agent) external view returns (Agent memory)

// Get all registered agents
function getAllAgents() external view returns (address[] memory)
```

#### Events

```solidity
event AgentRegistered(address indexed agent, string metadataURI, bytes32 pubKeyHash);
event AgentUpdated(address indexed agent, string metadataURI, bytes32 pubKeyHash);
event AgentStatusChanged(address indexed agent, bool active);
```

#### Agent Structure

```solidity
struct Agent {
    address agentAddress;    // Agent's EVM address
    string metadataURI;      // URI to off-chain metadata (IPFS, HTTPS, etc.)
    bytes32 pubKeyHash;      // Hash of public key or cryptographic identifier
    uint256 registeredAt;    // Registration timestamp
    bool active;             // Agent status
}
```

---

### ReputationHub.sol

The ReputationHub contract implements the on-chain reputation system for registered agents.

#### Features
- ✅ Rate other agents (only registered agents can rate)
- ✅ Update existing ratings
- ✅ Remove ratings
- ✅ Calculate aggregate reputation scores
- ✅ Prevent self-rating
- ✅ Score validation (-100 to 100 range)

#### Key Functions

```solidity
// Rate another agent
function rate(address ratee, int32 score) external onlyAgent

// Get agent's reputation
function getReputation(address agent) 
    external view 
    returns (int256 average, uint256 count, int256 total)
```

#### Events

```solidity
event Rated(
    address indexed rater,
    address indexed ratee,
    int32 previousScore,
    int32 newScore
);
```

#### Rating Rules

- **Score Range**: -100 to 100
- **Who Can Rate**: Only registered active agents
- **Self-Rating**: Not allowed
- **Update Rating**: Can update or remove previous ratings
- **Precision**: Average calculated with 2 decimal precision (e.g., 375 = 3.75)

## 🚀 Deployment

### Prerequisites

- Solidity compiler ^0.8.20
- Hardhat, Foundry, or Remix
- EVM-compatible network (Ethereum, Polygon, Base, etc.)

### Deployment Steps

1. **Deploy AgentRegistry first**
   ```solidity
   AgentRegistry agentRegistry = new AgentRegistry();
   ```

2. **Deploy ReputationHub with AgentRegistry address**
   ```solidity
   ReputationHub reputationHub = new ReputationHub(address(agentRegistry));
   ```

3. **Update frontend configuration**
   Update the contract addresses in `reputar-front/utils/contracts.ts`

### Example Deployment Script (Hardhat)

```javascript
const { ethers } = require("hardhat");

async function main() {
  // Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.deployed();
  console.log("AgentRegistry deployed to:", agentRegistry.address);

  // Deploy ReputationHub
  const ReputationHub = await ethers.getContractFactory("ReputationHub");
  const reputationHub = await ReputationHub.deploy(agentRegistry.address);
  await reputationHub.deployed();
  console.log("ReputationHub deployed to:", reputationHub.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🧪 Testing

### Test Scenarios

#### AgentRegistry
- ✅ Register new agent
- ✅ Prevent duplicate registration
- ✅ Update agent metadata
- ✅ Activate/deactivate agent
- ✅ Query agent information
- ✅ List all agents

#### ReputationHub
- ✅ Rate another agent
- ✅ Update existing rating
- ✅ Remove rating (set to 0)
- ✅ Prevent self-rating
- ✅ Prevent non-agent from rating
- ✅ Validate score range
- ✅ Calculate correct averages

### Example Test (Hardhat)

```javascript
describe("ReputationHub", function () {
  it("Should allow agents to rate each other", async function () {
    const [agent1, agent2] = await ethers.getSigners();
    
    // Register agents
    await agentRegistry.connect(agent1).registerAgent("ipfs://agent1", ethers.utils.id("agent1"));
    await agentRegistry.connect(agent2).registerAgent("ipfs://agent2", ethers.utils.id("agent2"));
    
    // Agent1 rates Agent2
    await reputationHub.connect(agent1).rate(agent2.address, 85);
    
    // Check reputation
    const [avg, count, total] = await reputationHub.getReputation(agent2.address);
    expect(avg).to.equal(8500); // 85.00 with 2 decimal precision
    expect(count).to.equal(1);
    expect(total).to.equal(85);
  });
});
```

## 🔒 Security Considerations

### AgentRegistry
- Only the agent owner can update their own information
- Agent addresses are immutable once registered
- Deactivated agents can be reactivated

### ReputationHub
- Only registered active agents can rate
- Self-rating is prevented
- Score range is validated (-100 to 100)
- Rating updates are atomic
- Previous ratings can be modified or removed

### Best Practices
- Always validate agent status before operations
- Use events for off-chain indexing
- Consider gas costs for large agent lists
- Implement access control for admin functions if needed

## 📊 Gas Optimization

- Agent list iteration should be done off-chain for large datasets
- Use indexed events for efficient querying
- Struct packing optimized for storage
- Immutable variables where possible

## 🔄 Upgrade Path

These contracts are not upgradeable by design for security and simplicity. For production:

- Consider implementing proxy patterns (UUPS, Transparent Proxy)
- Add pause functionality for emergency stops
- Implement role-based access control (OpenZeppelin AccessControl)
- Add governance mechanisms for parameter updates

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code follows Solidity style guide
- Gas optimizations are documented
- Security considerations are addressed

## 📚 Additional Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Development](https://ethereum.org/en/developers/)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

Built with Solidity ^0.8.20 for the Reputar AI ecosystem
