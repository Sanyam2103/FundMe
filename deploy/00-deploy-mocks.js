const { network } = require("hardhat")
const {
	developmentChains,
	INITIAL_ANSWER,
	DECIMAL,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, logs } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId

	if (developmentChains.includes(network.name)) {
		console.log("local network detected...deploying mocks")
		await deploy("MockV3Aggregator", {
			contract: "MockV3Aggregator",
			from: deployer,
			log: true,
			args: [DECIMAL, INITIAL_ANSWER],
		})
		console.log("mocks deployed!")
		console.log("------------------------")
	}
}
module.exports.tags = ["all", "mocks"]
