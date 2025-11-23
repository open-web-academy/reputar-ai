const ethers = require('ethers');

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const AGENT_REGISTRY_ADDRESS = "0x8004a6090Cd10A7288092483047B097295Fb8847";

async function probeContract() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log(`Probing ${AGENT_REGISTRY_ADDRESS}...`);

    // ERC-165 Interface IDs
    const ERC165_ID = "0x01ffc9a7";
    const ERC721_ID = "0x80ac58cd";
    const ERC721_METADATA_ID = "0x5b5e139f";
    const ERC721_ENUMERABLE_ID = "0x780e9d63";

    const erc165Abi = ["function supportsInterface(bytes4 interfaceId) view returns (bool)"];
    const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, erc165Abi, provider);

    try {
        const isERC165 = await contract.supportsInterface(ERC165_ID);
        console.log(`Supports ERC-165: ${isERC165}`);

        if (isERC165) {
            const isERC721 = await contract.supportsInterface(ERC721_ID);
            console.log(`Supports ERC-721: ${isERC721}`);

            const isMetadata = await contract.supportsInterface(ERC721_METADATA_ID);
            console.log(`Supports ERC-721 Metadata: ${isMetadata}`);

            const isEnumerable = await contract.supportsInterface(ERC721_ENUMERABLE_ID);
            console.log(`Supports ERC-721 Enumerable: ${isEnumerable}`);
        }
    } catch (e) {
        console.log("Error checking interfaces:", e.message);
    }

    // Check common ERC-721 functions
    const erc721Abi = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function tokenURI(uint256) view returns (string)"
    ];
    const nftContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, erc721Abi, provider);

    try {
        const name = await nftContract.name();
        console.log(`Name: ${name}`);
        const symbol = await nftContract.symbol();
        console.log(`Symbol: ${symbol}`);
    } catch (e) {
        console.log("Could not get name/symbol");
    }

    try {
        const total = await nftContract.totalSupply();
        console.log(`Total Supply: ${total.toString()}`);

        if (total > 0) {
            try {
                const uri = await nftContract.tokenURI(1);
                console.log(`Token URI #1: ${uri}`);
            } catch (e) {
                console.log("Could not get tokenURI for #1");
            }
        }
    } catch (e) {
        console.log("Could not get totalSupply (might not be Enumerable)");
    }
}

probeContract();
