const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../help-hardhat-config")
const { verufy, verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    console.log(">>>>", network.name)
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregatro = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregatro.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    console.log(">>>>", ethUsdPriceFeedAddress)
    args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        //put price fee address here
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
}
module.exports.tags = ["all", "fundme"]
