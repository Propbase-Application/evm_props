// We are going to skip a bit on these tests...

const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { isAwaitExpression } = require("typescript");
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PROPS TESTS", function () {
      let props,
        deployer,
        address1,
        address2,
        address3,
        multiSignaddress,
        multisignSigner,
        treasury_address;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        address1 = accounts[1];
        address2 = accounts[2];
        address3 = accounts[3];

        const Props = await ethers.getContractFactory("PROPS");
        props = await Props.deploy(ethers.parseUnits("2000000", 8));
        multiSignaddress = "0x6b9a6477df9B96ddA4CDf686845612998A1F8825";
        await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [multiSignaddress],
        });
        multisignSigner = await ethers.getSigner(multiSignaddress);
        topupEth(multiSignaddress);
        treasury_address = await props.treasury();
      });

      const topupEth = async (user) => {
        const amount = ethers.parseEther("10.0");
        const tx = await deployer.sendTransaction({
          to: user,
          value: amount,
        });

        // Wait for the transaction to be mined
        await tx.wait();
      };

      describe("Basic Functionality Test", function () {
        it("Initializes the PROPS Correctly.", async () => {
          const current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.toBigInt("0"));
          const mint_tranche_limit = await props.mint_tranche_limit();
          assert.equal(mint_tranche_limit, ethers.toBigInt("200000000000000"));
          const last_mint_timestamp = await props.last_mint_timestamp();
          assert.equal(last_mint_timestamp, ethers.toBigInt("0"));
          const last_mint_tranche_timestamp =
            await props.last_mint_tranche_timestamp();
          assert.equal(last_mint_tranche_timestamp, ethers.toBigInt("0"));

          const contractTreasury = await props.treasury();
          assert.equal(contractTreasury, multiSignaddress);
          const is_minter = await props.hasRole(
            ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
            multiSignaddress
          );
          assert.equal(is_minter, true);

          const is_limiter = await props.hasRole(
            ethers.keccak256(ethers.toUtf8Bytes("LIMITER_ROLE")),
            multiSignaddress
          );
          assert.equal(is_limiter, true);

          const decimals = await props.decimals();
          assert(decimals, 8);

          const DEFAULT_ADMIN_ROLE = "0x" + "00".repeat(32);
          const is_defualt_admin = await props.hasRole(
            DEFAULT_ADMIN_ROLE,
            deployer.address
          );
          assert.equal(is_defualt_admin, true);
        });
      });

      describe("setMintTrancheLimit", function () {
        it("Sets MintTrancheLimit correctly.", async () => {
          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("5", 8));

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.toBigInt("500000000"));
        });

        it("Emits MintTrancheLimitSetup on MintTrancheLimit correctly.", async () => {
          const timestamp = await time.latest();
          await expect(
            await props
              .connect(multisignSigner)
              .setMintTrancheLimit(ethers.parseUnits("5", 8))
          )
            .to.emit(props, "MintTrancheLimitSetup")
            .withArgs(
              multiSignaddress,
              ethers.parseUnits("5", 8),
              timestamp + 1
            );
        });

        it("only minter role can set MintTrancheLimit ", async () => {
          await expect(
            props
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits("12000000", 8))
          ).to.be.rejectedWith(
            `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
              ethers.toUtf8Bytes("LIMITER_ROLE")
            )}`
          );
        });

        it("can't set MintTrancheLimit > mint_cap.", async () => {
          await expect(
            props
              .connect(multisignSigner)
              .setMintTrancheLimit(ethers.parseUnits("12000000000", 8))
          ).to.be.revertedWithCustomError(
            props,
            "PROPS__MintTrancheLimitOutOfRange"
          );
        });

        it("can't set MintTrancheLimit > min_tranche_limit.", async () => {
          await expect(
            props
              .connect(multisignSigner)
              .setMintTrancheLimit(ethers.parseUnits("1000000000", 8))
          ).to.be.revertedWithCustomError(
            props,
            "PROPS__MintTrancheLimitOutOfRange"
          );
        });

        it("can set MintTrancheLimit multiple times after mint_delay", async () => {
          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("1000", 8));

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.parseUnits("1000", 8));
          await ethers.provider.send("evm_increaseTime", [172801]);
          await ethers.provider.send("evm_mine");

          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("2000", 8));

          const data1 = await props.mint_tranche_limit();
          assert.equal(data1, ethers.parseUnits("2000", 8));
        });

        it("can't set MintTrancheLimit multiple times without mint_delay", async () => {
          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("100000", 8));

          await expect(
            props
              .connect(multisignSigner)
              .setMintTrancheLimit(ethers.parseUnits("100000", 8))
          ).to.be.revertedWithCustomError(
            props,
            "PROPS__FrequencyTimeLimitNotReached"
          );
        });
      });

      describe("mint", function () {
        it("mint props correctly.", async () => {
          await props.connect(multisignSigner).mint(1000000000000);

          let address_1_bal = await props.balanceOf(treasury_address);
          assert.equal(address_1_bal.toString(), "1000000000000");

          const current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.toBigInt("1000000000000"));
        });

        it("only minter can mint props.", async () => {
          await expect(
            props.connect(deployer).mint(1000000000000)
          ).to.be.rejectedWith(
            `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
              ethers.toUtf8Bytes("MINTER_ROLE")
            )}`
          );
        });

        it("can't mint more than mint_cap.", async () => {
          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("1000000", 8));

          for (let i = 0; i < 1200; i++) {
            await props
              .connect(multisignSigner)
              .mint(ethers.parseUnits("1000000", 8));

            await ethers.provider.send("evm_increaseTime", [172801]);
            await ethers.provider.send("evm_mine");
          }

          await expect(
            props.connect(multisignSigner).mint(ethers.parseUnits("1000000", 8))
          ).to.be.revertedWithCustomError(props, "PROPS__MintCapReached");
        });

        it("can't mint more than mint tranche limit.", async () => {
          await expect(
            props
              .connect(multisignSigner)
              .mint(ethers.parseUnits("1000000010", 8))
          ).to.be.revertedWithCustomError(
            props,
            "PROPS__AmountTrancheLimitReached"
          );
        });

        it("can't mint before mint delay passed", async () => {
          await props
            .connect(multisignSigner)
            .mint(ethers.parseUnits("10000", 8));

          await expect(
            props.connect(multisignSigner).mint(ethers.parseUnits("10000", 8))
          ).to.be.revertedWithCustomError(
            props,
            "PROPS__FrequencyTimeLimitNotReached"
          );
        });
      });

      describe("Full Flow Test", function () {
        it("All functions works properly together.", async () => {
          let hasMinterRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
              multiSignaddress
            );
          let hasLimiterRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes("LIMITER_ROLE")),
              multiSignaddress
            );

          assert(hasMinterRole);
          assert(hasLimiterRole);

          for (let i = 0; i < 4; i++) {
            await props
              .connect(multisignSigner)
              .mint(ethers.parseUnits("2000000", 8));

            const current_timestamp = await time.latest();
            let mint_timestamp = await props.last_mint_timestamp();

            assert.equal(current_timestamp, mint_timestamp);
            await ethers.provider.send("evm_increaseTime", [172801]);
            await ethers.provider.send("evm_mine");
          }

          let current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.parseUnits("8000000", 8));

          await props
            .connect(multisignSigner)
            .setMintTrancheLimit(ethers.parseUnits("1000000", 8));

          const current_timestamp = await time.latest();

          let mint_tranche_timestamp =
            await props.last_mint_tranche_timestamp();
          assert.equal(
            ethers.toBigInt(current_timestamp),
            mint_tranche_timestamp
          );

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.parseUnits("1000000", 8));

          let address_1_bal = await props.balanceOf(treasury_address);
          assert.equal(address_1_bal.toString(), "800000000000000");
        });
      });
    });
describe("Full Flow Test 2", function () {
  let props,
    deployer,
    address1,
    address2,
    address3,
    multiSignaddress,
    multisignSigner,
    treasury_address;
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    address1 = accounts[1];
    address2 = accounts[2];
    address3 = accounts[3];

    const Props = await ethers.getContractFactory("PROPS");;
    props = await Props.deploy(ethers.parseUnits("15000000", 8));   
    multiSignaddress = "0x6b9a6477df9B96ddA4CDf686845612998A1F8825";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [multiSignaddress],
    });
    multisignSigner = await ethers.getSigner(multiSignaddress);
    topupEth(multiSignaddress);
    treasury_address = await props.treasury();
  });

  const topupEth = async (user) => {
    const amount = ethers.parseEther("10.0");
    const tx = await deployer.sendTransaction({
      to: user,
      value: amount,
    });

    // Wait for the transaction to be mined
    await tx.wait();
  };

  it("All functions works properly together.", async () => {

    let hasMinterRole = await props
      .connect(deployer)
      .hasRole(
        ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
        multiSignaddress
      );
    let hasLimiterRole = await props
      .connect(deployer)
      .hasRole(
        ethers.keccak256(ethers.toUtf8Bytes("LIMITER_ROLE")),
        multiSignaddress
      );

    assert(hasMinterRole);
    assert(hasLimiterRole);

    await props.connect(multisignSigner).mint(ethers.parseUnits("15000000", 8));

    const current_timestamp = await time.latest();
    let mint_timestamp = await props.last_mint_timestamp();

    assert.equal(current_timestamp, mint_timestamp);

    let current_supply = await props.current_supply();
    assert.equal(current_supply, ethers.parseUnits("15000000", 8));

    await props
      .connect(multisignSigner)
      .setMintTrancheLimit(ethers.parseUnits("1000000", 8));

    const current_timestamp2 = await time.latest();

    let mint_tranche_timestamp = await props.last_mint_tranche_timestamp();
    assert.equal(ethers.toBigInt(current_timestamp2), mint_tranche_timestamp);

    const data = await props.mint_tranche_limit();
    assert.equal(data, ethers.parseUnits("1000000", 8));

    let address_1_bal = await props.balanceOf(treasury_address);
    assert.equal(address_1_bal.toString(), "1500000000000000");
  });
});
