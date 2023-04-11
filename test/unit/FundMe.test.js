const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
describe("FundMe", async function () {
	let fundMe
	let mockV3Aggregator
	let deployer
	const sendValue = ethers.utils.parseEther("1")
	!developmentChains.includes(network.name)
		? describe.skip
		: beforeEach(async function () {
				// const accounts = await ethers.getSigners()
				// deployer = accounts[0]
				deployer = (await getNamedAccounts()).deployer
				await deployments.fixture(["all"])
				fundMe = await ethers.getContract("FundMe", deployer)
				mockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				)
		  })
	describe("constructor", async function () {
		it("sets the aggregator addresses correctly", async () => {
			const response = await fundMe.getPriceFeed()
			assert.equal(response, mockV3Aggregator.address)
		})
	})
	describe("fund", async function () {
		it("fails if you dont send enough eth", async function () {
			await expect(fundMe.fund()).to.be.revertedWith(
				"You need to spend more ETH!"
			)
		})
		it("updates the amount funded data structure", async function () {
			await fundMe.fund({ value: sendValue })
			const response = await fundMe.getAddressToAmountFunded(deployer)
			assert.equal(response.toString(), sendValue.toString())
		})
		it("adds funder to array of getFunders", async function () {
			await fundMe.fund({ value: sendValue })
			const funder = await fundMe.getFunders(0)
			assert.equal(funder, deployer)
		})
	})
	describe("withdraw", async function () {
		beforeEach(async function () {
			await fundMe.fund({ value: sendValue })
		})
		it("withdraw eth from a single founder", async function () {
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)

			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				startingFundMeBalance.add(startingDeployerBalance).toString(),
				endingDeployerBalance.add(gasCost).toString()
			)
		})
		it("is allows us to withdraw with multiple getFunders", async function () {
			const accounts = await ethers.getSigners()
			for (i = 1; i < 6; i++) {
				const attackerConnectedContract = await fundMe.connect(
					accounts[i]
				)
				await attackerConnectedContract.fund({ value: sendValue })
			}
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			const transactionResponse = await fundMe.withdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)

			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				startingFundMeBalance.add(startingDeployerBalance).toString(),
				endingDeployerBalance.add(gasCost).toString()
			)
			await expect(fundMe.getFunders(0)).to.be.reverted
			for (i = 1; i < 6; i++) {
				assert.equal(
					await fundMe.getAddressToAmountFunded(accounts[i].address),
					0
				)
			}
		})
		it("only allows the owner to withdraw", async function () {
			const accounts = await ethers.getSigners()

			const attackerConnectedContract = await fundMe.connect(accounts[1])
			await expect(
				attackerConnectedContract.withdraw()
			).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
		})
		it("cheaper withdraw", async function () {
			const accounts = await ethers.getSigners()
			for (i = 1; i < 6; i++) {
				const attackerConnectedContract = await fundMe.connect(
					accounts[i]
				)
				await attackerConnectedContract.fund({ value: sendValue })
			}
			const startingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const startingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)
			const transactionResponse = await fundMe.cheaperWithdraw()
			const transactionReceipt = await transactionResponse.wait(1)
			const { gasUsed, effectiveGasPrice } = transactionReceipt
			const gasCost = gasUsed.mul(effectiveGasPrice)

			const endingFundMeBalance = await fundMe.provider.getBalance(
				fundMe.address
			)
			const endingDeployerBalance = await fundMe.provider.getBalance(
				deployer
			)

			assert.equal(endingFundMeBalance, 0)
			assert.equal(
				startingFundMeBalance.add(startingDeployerBalance).toString(),
				endingDeployerBalance.add(gasCost).toString()
			)
			await expect(fundMe.getFunders(0)).to.be.reverted
			for (i = 1; i < 6; i++) {
				assert.equal(
					await fundMe.getAddressToAmountFunded(accounts[i].address),
					0
				)
			}
		})
	})
})
