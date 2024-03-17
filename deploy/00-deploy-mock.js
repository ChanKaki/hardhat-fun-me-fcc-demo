const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../help-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    console.log(">>>>",chainId);
    if (developmentChains.includes(network.name)) {
        log("mocking begining-----")
        await deploy("MockV3Aggregator", {
            contract:"MockV3Aggregator",
            from:deployer,
            log:true,
            args:[DECIMALS,INITIAL_ANSWER]
        })
    }
}

module.exports.tags = ["all","mocks"]