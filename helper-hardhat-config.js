const networkConfig = {
	31337: {
		name: "localhost",
		chainId: "31337",
	},
	// Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
	11155111: {
		name: "sepolia",
		ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
		chainId: 11155111,
	},
}
const developmentChains = ["hardhat", "localhost"]
const DECIMAL = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
	networkConfig,
	developmentChains,
	DECIMAL,
	INITIAL_ANSWER,
}
