const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", async function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.parseUnits("1")
    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async function () {
        it("sets the aggregator addresss correnctly", async function () {
            const response = await fundMe.priceFeed()
            assert.equal(response, mockV3Aggregator.target)
        })
    })

    describe("fund", async function () {
        it("faile if you don't send enough ETH", async function () {
            console.log(">>>> test >>>>>>>> faile ")
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })

        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.funders(0)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })
        it("withdraws ETH from a single funder", async () => {
            //当前合约账户
            const startingFuneMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            //调用方账户
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, gasPrice } = transactionReceipt
            // withdraw 所花费的gas
            const gasCost = gasUsed * gasPrice

            //fundme 的当前总额在withdraw后归零
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            assert.equal(endingFundMeBalance, 0)

            // 合约账户+调用方账户 = 调用方调用用withdraw方法后的账户金额+gas消费
            assert.equal(
                (startingFuneMeBalance + startingDeployerBalance).toString(),
                (endingDeployerBalance + gasCost).toString()
            )
        })

        it("allows us to withdraw with multiple funders", async function () {
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectionContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectionContract.fund({ value: sendValue })
            }
            const startingFuneMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            //调用方账户
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, gasPrice } = transactionReceipt
            const gasCost = gasUsed * gasPrice

            //fundme 的当前总额在withdraw后归零
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            )
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            )
            assert.equal(endingFundMeBalance, 0)

            // 合约账户+调用方账户 = 调用方调用用withdraw方法后的账户金额+gas消费
            assert.equal(
                (startingFuneMeBalance + startingDeployerBalance).toString(),
                (endingDeployerBalance + gasCost).toString()
            )

            await expect(fundMe.funders(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.addressToAmountFunded(
                        accounts[i].getAddress()
                    ),
                    0
                )
            }
        })

        it("only allows the owner to withdraw", async function () {
            const accounts = ethers.getSigners()
            // 随机一个作为attacker

            const attackerConnectedContract = await fundMe.connect(accounts[1])

            console.log(attackerConnectedContract)
            await attackerConnectedContract.withdraw()

            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("Fundme_NotOwner")
        })
    })
})
