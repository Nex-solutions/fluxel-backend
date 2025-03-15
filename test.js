const { ethers } = require("ethers");
const { abi: SwapRouterABI } = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");

// Uniswap V3 SwapRouter Address (for Ethereum mainnet)
const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9eb0cE3606eB48";

async function swapUSDTtoUSDC(providerUrl, privateKey, amountIn) {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get SwapRouter contract
    const swapRouter = new ethers.Contract(SWAP_ROUTER_ADDRESS, SwapRouterABI, wallet);

    // Set up token approvals
    const USDT = new ethers.Contract(USDT_ADDRESS, ["function approve(address spender, uint256 amount) external returns (bool)"], wallet);
    const amountInWei = ethers.parseUnits(amountIn.toString(), 6); // USDT has 6 decimals

    // Approve Uniswap to spend USDT
    const approvalTx = await USDT.approve(SWAP_ROUTER_ADDRESS, amountInWei);
    await approvalTx.wait();

    // Swap parameters
    const swapParams = {
        tokenIn: USDT_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 500, // 0.05% fee tier
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
        amountIn: amountInWei,
        amountOutMinimum: 0, // Set this properly to avoid MEV attacks
        sqrtPriceLimitX96: 0
    };

    // Execute swap
    const swapTx = await swapRouter.exactInputSingle(swapParams);
    const receipt = await swapTx.wait();

    console.log(`Swapped ${amountIn} USDT for USDC:`, receipt.transactionHash);
}

// Example usage
const providerUrl = "https://mainnet.infura.io/v3/b9c50c33d5dc422da0d579c8f180f07a";
const privateKey = "2110915a987cdbf29bd2e251dbba226fe33efabbb64928208999ff0e212ac432";
const amountIn = 100; // Swap 100 USDT

swapUSDTtoUSDC(providerUrl, privateKey, amountIn)
    .then(() => console.log("Swap successful"))
    .catch(console.error);
