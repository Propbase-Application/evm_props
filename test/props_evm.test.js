// We are going to skip a bit on these tests...

const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PROPS TESTS", function () {
      let props, test, deployer, address1, address2, address3;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        address1 = accounts[1];
        address2 = accounts[2];
        address3 = accounts[3];

        const Props = await ethers.getContractFactory("PROPS");
        const Test = await ethers.getContractFactory("TEST");
        props = await Props.deploy(
          ethers.parseUnits("1200000000", 8),
          1000000000000,
          500000000000,
          86400,
          86400,
          "www.icon.com"
        );
        let props_address = await props.getAddress();
        test = await Test.deploy(props_address);
      });
      describe("Basic Functionality Test", function () {
        it("Initializes the PROPS Correctly.", async () => {
          const data = await props.getCoinConfig();
          assert.equal(data[0], ethers.parseUnits("1200000000", 8));
          assert.equal(data[1], ethers.toBigInt("1000000000000"));
          assert.equal(data[2], ethers.toBigInt("500000000000"));
          assert.equal(data[3], ethers.toBigInt("86400"));
          assert.equal(data[4], ethers.toBigInt("86400"));
          assert.equal(data[5], "www.icon.com");
        });

        describe("Admin Functionality Test", function () {
          it("Sets admin correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupAdmin(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
                test_address
              );
            assert(hasRole);
          });

          it("emit AdminSetup correctly.", async () => {
            let test_address = await test.getAddress();
            const timestamp = await time.latest();

            await expect(props.connect(deployer).setupAdmin(test_address))
              .to.emit(props, "AdminSetup")
              .withArgs(test_address, timestamp + 1);
          });

          it("only admin can setupAdmins.", async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).setupAdmin(test_address)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("ADMIN_ROLE")
              )}`
            );
          });

          it("admin can't set zero address.", async () => {
            await expect(
              props.connect(deployer).setupAdmin(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(props, "PROPS__InvalidAddress");
          });

          it("admin can't set individual address.", async () => {
            await expect(
              props.connect(deployer).setupAdmin(address2.address)
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__AddressNotMultiSign"
            );
          });

          it("Revokes admin correctly.", async () => {
            await props.connect(deployer).revokeAdmin(deployer.address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
                deployer.address
              );
            assert(!hasRole);
          });

          it("Emits AdminRevoked correctly on revoke admin.", async () => {
            const timestamp = await time.latest();
            await expect(props.connect(deployer).revokeAdmin(deployer.address))
              .to.emit(props, "AdminRevoked")
              .withArgs(deployer.address, timestamp + 1);
          });

          it("Revokes admin can't set zero address.", async () => {
            await expect(
              props.connect(deployer).revokeAdmin(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(props, "PROPS__InvalidAddress");
          });
        });

        describe("Minter Functionality Test", function () {
          it("Sets minter correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
                test_address
              );
            assert(hasRole);
          });

          it("Emits MinterSetup on minter correctly.", async () => {
            const timestamp = await time.latest();
            let test_address = await test.getAddress();
            await expect(
              props.connect(deployer).setupMinter(test_address, true)
            )
              .to.emit(props, "MinterSetup")
              .withArgs(test_address, timestamp + 1);
          });

          it("Unsets minter correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
                test_address
              );
            assert(hasRole);
            await props.connect(deployer).setupMinter(test_address, false);
            let hasRole2 = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
                test_address
              );
            assert(!hasRole2);
          });

          it("Only admin can setup minter.", async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).setupMinter(test_address, true)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("ADMIN_ROLE")
              )}`
            );
          });

          it("admin can't setup zero address minter.", async () => {
            await expect(
              props.connect(deployer).setupMinter(ethers.ZeroAddress, true)
            ).to.be.revertedWithCustomError(props, "PROPS__InvalidAddress");
          });

          it("admin can't set individual address with minter role.", async () => {
            await expect(
              props.connect(deployer).setupMinter(address1.address, true)
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__AddressNotMultiSign"
            );
          });
        });

        describe("Burner Functionality Test", function () {
          it("Sets burner correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")),
                test_address
              );
            assert(hasRole);
          });

          it("Emits BurnerSetup on set burner correctly.", async () => {
            const timestamp = await time.latest();
            let test_address = await test.getAddress();
            await expect(
              props.connect(deployer).setupBurner(test_address, true)
            )
              .to.emit(props, "BurnerSetup")
              .withArgs(test_address, timestamp + 1);
          });

          it("Unsets burner correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")),
                test_address
              );
            assert(hasRole);
            await props.connect(deployer).setupBurner(test_address, false);
            let hasRole2 = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE")),
                test_address
              );
            assert(!hasRole2);
          });

          it("Only admin can setup burner.", async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).setupBurner(test_address, true)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("ADMIN_ROLE")
              )}`
            );
          });

          it("admin can't setup zero address burner.", async () => {
            await expect(
              props.connect(deployer).setupBurner(ethers.ZeroAddress, true)
            ).to.be.revertedWithCustomError(props, "PROPS__InvalidAddress");
          });

          it("admin can't set individual address with burner role.", async () => {
            await expect(
              props.connect(deployer).setupBurner(address1.address, true)
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__AddressNotMultiSign"
            );
          });
        });

        describe("setMintTrancheCap Functionality Test", function () {
          it("Sets MintTrancheCap correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .setMintTrancheCap(ethers.parseUnits("5", 8));

            const data = await props.getCoinConfig();
            assert.equal(data[1], ethers.toBigInt("500000000"));
          });

          it("Emits MintTrancheCapSetup on MintTrancheCap correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            const timestamp = await time.latest();
            await expect(
              test
                .connect(deployer)
                .setMintTrancheCap(ethers.parseUnits("5", 8))
            )
              .to.emit(props, "MintTrancheCapSetup")
              .withArgs(test_address, ethers.parseUnits("5", 8), timestamp + 1);
          });

          it("only minter role can set MintTrancheCap ", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);

            await expect(
              props
                .connect(deployer)
                .setMintTrancheCap(ethers.parseUnits("12000000", 8))
            ).to.be.rejectedWith(
              `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("MINTER_ROLE")
              )}`
            );
          });

          it("can't set MintTrancheCap > mint_cap.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);

            await expect(
              test
                .connect(deployer)
                .setMintTrancheCap(ethers.parseUnits("12000000000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__MintTrancheCapOutOfRange"
            );
          });

          it("can't set MintTrancheCap > min_tranche_limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);

            await expect(
              test
                .connect(deployer)
                .setMintTrancheCap(ethers.parseUnits("1000000000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__MintTrancheCapOutOfRange"
            );
          });

          it("can set MintTrancheCap multiple times after mint_delay", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            test
              .connect(deployer)
              .setMintTrancheCap(ethers.parseUnits("10000", 8));

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            test
              .connect(deployer)
              .setMintTrancheCap(ethers.parseUnits("10000", 8));

            const data = await props.getCoinConfig();
            assert.equal(data[1], ethers.toBigInt("1000000000000"));
          });

          it("can't set MintTrancheCap multiple times without mint_delay", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .setMintTrancheCap(ethers.parseUnits("100000", 8));

            await expect(
              test
                .connect(deployer)
                .setMintTrancheCap(ethers.parseUnits("100000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__FrequencyTimeLimitNotReached"
            );
          });
        });

        describe("setBurnTrancheCap Functionality Test", function () {
          it("Sets BurnTrancheCap correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            await test
              .connect(deployer)
              .setBurnTrancheCap(ethers.parseUnits("5", 8));

            const data = await props.getCoinConfig();
            assert.equal(data[2], ethers.toBigInt("500000000"));
          });

          it("Emits  BurnTrancheCap correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            const timestamp = await time.latest();
            await expect(
              test
                .connect(deployer)
                .setBurnTrancheCap(ethers.parseUnits("5", 8))
            )
              .to.emit(props, "BurnTrancheCapSetup")
              .withArgs(test_address, ethers.parseUnits("5", 8), timestamp + 1);
          });

          it("only burner role can set MintTrancheCap ", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);

            await expect(
              props
                .connect(deployer)
                .setBurnTrancheCap(ethers.parseUnits("12000000", 8))
            ).to.be.rejectedWith(
              `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("BURNER_ROLE")
              )}`
            );
          });

          it("can't set BurnTrancheCap > mint_cap.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);

            await expect(
              test
                .connect(deployer)
                .setBurnTrancheCap(ethers.parseUnits("12000000000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__BurnTrancheCapOutOfRange"
            );
          });

          it("can't set MintTrancheCap > min_tranche_limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);

            await expect(
              test
                .connect(deployer)
                .setBurnTrancheCap(ethers.parseUnits("10000001", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__BurnTrancheCapOutOfRange"
            );
          });

          it("can set BurnTrancheCap multiple times after burn_delay", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            test
              .connect(deployer)
              .setBurnTrancheCap(ethers.parseUnits("10000", 8));

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            test
              .connect(deployer)
              .setBurnTrancheCap(ethers.parseUnits("10000", 8));

            const data = await props.getCoinConfig();
            assert.equal(data[2], ethers.toBigInt("1000000000000"));
          });

          it("can't set BurnTrancheCap multiple times without burn_delay", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            await test
              .connect(deployer)
              .setBurnTrancheCap(ethers.parseUnits("10000000", 8));

            await expect(
              test
                .connect(deployer)
                .setBurnTrancheCap(ethers.parseUnits("10000000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__FrequencyTimeLimitNotReached"
            );
          });
        });

        describe("mint Functionality Test", function () {
          it("mint props correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await test.connect(deployer).mint(address1.address, 1000000000000);

            let address_1_bal = await props.balanceOf(address1.address);
            assert.equal(address_1_bal.toString(), "1000000000000");
          });

          it("only minter can mint props.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await expect(
              props.connect(deployer).mint(address1.address, 1000000000000)
            ).to.be.rejectedWith(
              `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("MINTER_ROLE")
              )}`
            );
          });

          it("can't mint more than min_cap.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .setMintTrancheCap(ethers.parseUnits("10000000", 8));

            for (let i = 0; i < 120; i++) {
              await test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits("10000000", 8));

              await ethers.provider.send("evm_increaseTime", [86401]);
              await ethers.provider.send("evm_mine");
            }

            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits("10000000", 8))
            ).to.be.revertedWithCustomError(props, "PROPS__MintCapReached");
          });

          it("can't mint more than mint tranche limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits("1000000010", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__AmountTrancheCapReached"
            );
          });

          it("can't mint before mint delay passed", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .mint(address1.address, ethers.parseUnits("10000", 8));

            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits("10000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__FrequencyTimeLimitNotReached"
            );
          });
        });

        describe("burn Functionality Test", function () {
          it("burn props correctly.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await props.connect(deployer).setupBurner(test_address, true);
            await test.connect(deployer).mint(address1.address, 1000000000000);

            let address_1_bal = await props.balanceOf(address1.address);
            assert.equal(address_1_bal.toString(), "1000000000000");

            await test.connect(deployer).burn(address1.address, 100000000);

            let address_1_bal_after = await props.balanceOf(address1.address);

            let amount = ethers.toNumber(address_1_bal) - 100000000;
            assert.equal(address_1_bal_after.toString(), amount.toString());
          });

          it("only burner can burn props.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await expect(
              test.connect(deployer).burn(address1.address, 100000000)
            ).to.be.rejectedWith(
              `AccessControl: account ${test_address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes("BURNER_ROLE")
              )}`
            );
          });

          it("can't burn more than current supply.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .setBurnTrancheCap(ethers.parseUnits("10000000", 8));

            await test
              .connect(deployer)
              .mint(address1.address, ethers.parseUnits("1000", 8));

            await expect(
              test
                .connect(deployer)
                .burn(address1.address, ethers.parseUnits("1005", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__BurnAmountNotAvailable"
            );
          });

          it("can't burn more than burn tranche limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupBurner(test_address, true);
            await props.connect(deployer).setupMinter(test_address, true);
            await test
              .connect(deployer)
              .mint(address1.address, ethers.parseUnits("1000", 8));

            await expect(
              test
                .connect(deployer)
                .burn(address1.address, ethers.parseUnits("1000000010", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__AmountTrancheCapReached"
            );
          });

          it("can't burn before mint delay passed", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).setupMinter(test_address, true);
            await props.connect(deployer).setupBurner(test_address, true);
            await test
              .connect(deployer)
              .mint(address1.address, ethers.parseUnits("10000", 8));

            await test
              .connect(deployer)
              .burn(address1.address, ethers.parseUnits("5000", 8));

            await expect(
              test
                .connect(deployer)
                .burn(address1.address, ethers.parseUnits("5000", 8))
            ).to.be.revertedWithCustomError(
              props,
              "PROPS__FrequencyTimeLimitNotReached"
            );
          });
        });
      });
    });
