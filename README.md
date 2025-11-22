# Reputar AI 🧠⛓️

> Decentralized reputation system for AI agents on blockchain

Reputar AI is a comprehensive Web3 application that enables transparent, on-chain reputation management for AI agents. Built with Solidity smart contracts and a retro Windows 98-styled frontend, it provides a unique and functional platform for agent registration, rating, and reputation tracking.

## 🌟 Features

- **🤖 Agent Registration**: Register AI agents on-chain with metadata and cryptographic identifiers
- **⭐ Reputation System**: Rate agents on a scale from -100 to 100
- **📊 Leaderboard**: View real-time reputation rankings with aggregate scores
- **🔐 Multi-Wallet Support**: Connect with MetaMask, Coinbase Wallet, or any EIP-1193 compatible wallet
- **🎨 Windows 98 UI**: Nostalgic retro interface with modern Web3 functionality
- **⚡ Real-time Updates**: Live wallet status and network detection
- **📱 Responsive Design**: Works across desktop and mobile devices

## 📁 Project Structure

```
reputar-ai/
├── contracts/          # Solidity smart contracts
│   ├── AgentRegistry.sol
│   └── ReputationHub.sol
├── reputar-front/      # Next.js frontend application
│   ├── app/
│   ├── components/
│   ├── contexts/
│   ├── types/
│   └── utils/
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cloudmex/reputar-ai.git
   cd reputar-ai
   ```

2. **Install frontend dependencies**
   ```bash
   cd reputar-front
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Smart Contracts

The smart contracts are located in the `contracts/` directory. To deploy them:

1. Deploy `AgentRegistry.sol` first
2. Deploy `ReputationHub.sol` with the AgentRegistry address
3. Update contract addresses in `reputar-front/utils/contracts.ts`

### Frontend Configuration

Update the contract addresses in `reputar-front/utils/contracts.ts`:

```typescript
export const AGENT_REGISTRY_ADDRESS = "0xYourDeployedAddress";
export const REPUTATION_HUB_ADDRESS = "0xYourDeployedAddress";
```

## 🎮 How to Use

### 1. Connect Your Wallet
- Click the "Connect Wallet" icon or the wallet indicator in the taskbar
- Choose your preferred wallet (MetaMask, Coinbase Wallet, or Other)
- Approve the connection

### 2. Register an Agent
- Open "Register Agent" from the desktop or Start menu
- Enter your agent's metadata URI (IPFS, HTTPS, etc.)
- Click "Register Agent" and confirm the transaction

### 3. Rate an Agent
- Open "Submit Rating" from the desktop or Start menu
- Enter the agent's address
- Provide a score between -100 and 100
- Submit and confirm the transaction

### 4. View Reputation
- Open "Reputation Hub" to see the leaderboard
- View all registered agents sorted by average score
- Click "Refresh" to reload data from the blockchain

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity** ^0.8.20
- **EVM-compatible** blockchains

### Frontend
- **Next.js** 16.0.3 (React 19)
- **TypeScript** 5+
- **Ethers.js** 6.15.0
- **Coinbase Wallet SDK** 4.2.3
- **Tailwind CSS** 4
- **98.css** for retro styling

## 🌐 Supported Networks

Reputar AI works on all EVM-compatible networks:

- Ethereum Mainnet
- Sepolia Testnet
- Polygon
- Base
- Base Sepolia
- And more...

## 📚 Documentation

For detailed documentation on each component:

- [Smart Contracts Documentation](./contracts/README.md)
- [Frontend Documentation](./reputar-front/README.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Windows 98 icons from [win98icons.alexmeub.com](https://win98icons.alexmeub.com)
- 98.css for the retro styling
- Coinbase Wallet SDK for embedded wallet support
- The Ethereum and Web3 community

## 📞 Contact

- GitHub: [@cloudmex](https://github.com/cloudmex)
- Project Link: [https://github.com/cloudmex/reputar-ai](https://github.com/cloudmex/reputar-ai)

---

Built with ❤️ for the decentralized AI agent ecosystem
