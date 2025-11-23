const ethers = require('ethers');

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const REPUTATION_HUB_ADDRESS = "0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E";

async function probeReputation() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log(`Probing ReputationHub ${REPUTATION_HUB_ADDRESS}...`);

    // Try to guess some functions
    const abi = [
        "function getReputation(address) view returns (int256, uint256, int256)",
        "function getReputation(uint256) view returns (int256, uint256, int256)",
        "function totalSupply() view returns (uint256)", // Maybe it tracks reputation tokens?
        "function name() view returns (string)"
    ];

    const contract = new ethers.Contract(REPUTATION_HUB_ADDRESS, abi, provider);

    try {
        const name = await contract.name();
        console.log(`Name: ${name}`);
    } catch (e) { }

    // Try to get reputation for a random address
    try {
        const rep = await contract.getReputation("0x1234567890123456789012345678901234567890");
        console.log("getReputation(address) works!");
        console.log(rep);
    } catch (e) {
        console.log("getReputation(address) failed");
    }

    // Try to get reputation for a token ID (if it uses IDs)
    try {
        const rep = await contract.getReputation(1);
        console.log("getReputation(uint256) works!");
        console.log(rep);
    } catch (e) {
        console.log("getReputation(uint256) failed");
    }
}

probeReputation();
