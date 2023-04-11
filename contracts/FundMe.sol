// SPDX-License-Identifier: MIT
pragma solidity >=0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
	using PriceConverter for uint256;

	mapping(address => uint256) private s_addressToAmountFunded;

	address[] private s_funders;

	address private immutable i_owner;

	uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

	AggregatorV3Interface private s_priceFeed;

	modifier onlyOwner() {
		require(msg.sender == i_owner, "FundMe__NotOwner");
		_;
	}

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		s_priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	// Explainer from: https://solidity-by-example.org/fallback/
	// Ether is sent to contract
	//      is msg.data empty?
	//          /   \
	//         yes  no
	//         /     \
	//    receive()?  fallback()
	//     /   \
	//   yes   no
	//  /        \
	//receive()  fallback()

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	function fund() public payable {
		require(
			msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
			"You need to spend more ETH!"
		);
		s_addressToAmountFunded[msg.sender] += msg.value;
		s_funders.push(msg.sender);
	}

	function getVersion() public view returns (uint256) {
		AggregatorV3Interface s_priceFeed = AggregatorV3Interface(
			0x694AA1769357215DE4FAC081bf1f309aDC325306
		);
		return s_priceFeed.version();
	}

	function withdraw() public onlyOwner {
		for (
			uint256 funderIndex = 0;
			funderIndex < s_funders.length;
			funderIndex++
		) {
			address funder = s_funders[funderIndex];
			s_addressToAmountFunded[funder] = 0;
		}
		s_funders = new address[](0);

		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}("");
		require(callSuccess, "Call failed");
	}

	function priceFeed() public view returns (AggregatorV3Interface) {
		return s_priceFeed;
	}

	function cheaperWithdraw() public payable onlyOwner {
		address[] memory funders = s_funders;
		for (uint256 i = 0; i < funders.length; i++) {
			address funder = funders[i];
			s_addressToAmountFunded[funder] = 0;
		}
		s_funders = new address[](0);

		(bool success, ) = i_owner.call{value: address(this).balance}("");
		require(success);
	}

	function getAddressToAmountFunded(
		address fundingAddress
	) public view returns (uint256) {
		return s_addressToAmountFunded[fundingAddress];
	}

	function getFunders(uint256 index) public view returns (address) {
		return s_funders[index];
	}

	function getOwner() public view returns (address) {
		return i_owner;
	}

	function getPriceFeed() public view returns (AggregatorV3Interface) {
		return s_priceFeed;
	}
}
