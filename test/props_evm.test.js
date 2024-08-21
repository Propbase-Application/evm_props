// We are going to skip a bit on these tests...

const { assert, expect } = require('chai');
const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('PROPS TESTS', function () {
      let props, test, deployer, address1, address2, address3;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        address1 = accounts[1];
        address2 = accounts[2];
        address3 = accounts[3];

        const Props = await ethers.getContractFactory('PROPS');
        const Test = await ethers.getContractFactory('TEST');
        props = await Props.deploy(ethers.parseUnits('1000000', 8));
        let props_address = await props.getAddress();
        test = await Test.deploy(props_address);
      });
      describe('Basic Functionality Test', function () {
        it('Initializes the PROPS Correctly.', async () => {
          const data = await props.getCoinConfig();
          assert.equal(data[1], ethers.toBigInt('100000000000000'));
        });

        describe('Admin Functionality Test', function () {
          it('Sets admin correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeAdmin(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
                test_address
              );
            assert(hasRole);
          });

          it('emit AdminChanged correctly.', async () => {
            let test_address = await test.getAddress();
            const timestamp = await time.latest();

            await expect(props.connect(deployer).changeAdmin(test_address))
              .to.emit(props, 'AdminChanged')
              .withArgs(test_address, timestamp + 1);
          });

          it('only admin can changeAdmin.', async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).changeAdmin(test_address)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes('ADMIN_ROLE')
              )}`
            );
          });

          it("admin can't set zero address.", async () => {
            await expect(
              props.connect(deployer).changeAdmin(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
          });

          it("admin can't set individual address.", async () => {
            await expect(
              props.connect(deployer).changeAdmin(address2.address)
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__AddressNotMultiSign'
            );
          });

          it('Revokes admin correctly.', async () => {
            await props.connect(deployer).revokeAdmin(
              // ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              deployer.address
            );
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
                deployer.address
              );
            assert(!hasRole);
          });

          it('Emits AdminRevoked correctly on revoke admin.', async () => {
            const timestamp = await time.latest();
            await expect(
              props.connect(deployer).revokeAdmin(
                // ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
                deployer.address
              )
            )
              .to.emit(props, 'AdminRevoked')
              .withArgs(deployer.address, timestamp + 1);
          });

          it("Revokes admin can't set zero address.", async () => {
            await expect(
              props.connect(deployer).revokeAdmin(
                // ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
                ethers.ZeroAddress
              )
            ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
          });
        });

        describe('Parameter Admin Functionality Test', function () {
          it('Sets parameter admin correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
                test_address
              );
            assert(hasRole);
          });

          it('Emits LimiterChanged on parameter admin correctly.', async () => {
            const timestamp = await time.latest();
            let test_address = await test.getAddress();
            await expect(props.connect(deployer).changeLimiter(test_address))
              .to.emit(props, 'LimiterChanged')
              .withArgs(test_address, timestamp + 1);
          });

          it('Unsets parameteter admin correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
                test_address
              );
            assert(hasRole);
            await props.connect(deployer).changeLimiter(test_address);
            let hasRole2 = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
                test_address
              );
            assert(!hasRole2);
          });

          it('Only admin can setup parameter admin.', async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).changeLimiter(test_address)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes('ADMIN_ROLE')
              )}`
            );
          });

          it("admin can't setup zero address parameter admin.", async () => {
            await expect(
              props.connect(deployer).changeLimiter(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
          });

          it("admin can't set individual address with parameter admin role.", async () => {
            await expect(
              props.connect(deployer).changeLimiter(address1.address)
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__AddressNotMultiSign'
            );
          });
        });

        describe('Minter Functionality Test', function () {
          it('Sets minter correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
                test_address
              );
            assert(hasRole);
          });

          it('Emits MinterChanged on minter correctly.', async () => {
            const timestamp = await time.latest();
            let test_address = await test.getAddress();
            await expect(props.connect(deployer).changeMinter(test_address))
              .to.emit(props, 'MinterChanged')
              .withArgs(test_address, timestamp + 1);
          });

          it('Unsets minter correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            let hasRole = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
                test_address
              );
            assert(hasRole);
            await props.connect(deployer).changeMinter(test_address);
            let hasRole2 = await props
              .connect(deployer)
              .hasRole(
                ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
                test_address
              );
            assert(!hasRole2);
          });

          it('Only admin can setup minter.', async () => {
            let test_address = await test.getAddress();
            await expect(
              props.connect(address2).changeMinter(test_address)
            ).to.be.rejectedWith(
              `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes('ADMIN_ROLE')
              )}`
            );
          });

          it("admin can't setup zero address minter.", async () => {
            await expect(
              props.connect(deployer).changeMinter(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
          });

          it("admin can't set individual address with minter role.", async () => {
            await expect(
              props.connect(deployer).changeMinter(address1.address)
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__AddressNotMultiSign'
            );
          });
        });

        describe('setMintTrancheLimit Functionality Test', function () {
          it('Sets MintTrancheLimit correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            await test
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits('5', 8));

            const data = await props.getCoinConfig();
            assert.equal(data[1], ethers.toBigInt('500000000'));
          });

          it('Emits MintTrancheLimitSetup on MintTrancheLimit correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            const timestamp = await time.latest();
            await expect(
              test
                .connect(deployer)
                .setMintTrancheLimit(ethers.parseUnits('5', 8))
            )
              .to.emit(props, 'MintTrancheLimitSetup')
              .withArgs(test_address, ethers.parseUnits('5', 8), timestamp + 1);
          });

          it('only minter role can set MintTrancheLimit ', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);

            await expect(
              props
                .connect(deployer)
                .setMintTrancheLimit(ethers.parseUnits('12000000', 8))
            ).to.be.rejectedWith(
              `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes('LIMITER_ROLE')
              )}`
            );
          });

          it("can't set MintTrancheLimit > mint_cap.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);

            await expect(
              test
                .connect(deployer)
                .setMintTrancheLimit(ethers.parseUnits('12000000000', 8))
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__MintTrancheLimitOutOfRange'
            );
          });

          it("can't set MintTrancheLimit > min_tranche_limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);

            await expect(
              test
                .connect(deployer)
                .setMintTrancheLimit(ethers.parseUnits('1000000000', 8))
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__MintTrancheLimitOutOfRange'
            );
          });

          it('can set MintTrancheLimit multiple times after mint_delay', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            test
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits('10000', 8));

            await ethers.provider.send('evm_increaseTime', [172801]);
            await ethers.provider.send('evm_mine');

            test
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits('10000', 8));

            const data = await props.getCoinConfig();
            assert.equal(data[1], ethers.parseUnits('10000', 8));
          });

          it("can't set MintTrancheLimit multiple times without mint_delay", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeLimiter(test_address);
            await test
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits('100000', 8));

            await expect(
              test
                .connect(deployer)
                .setMintTrancheLimit(ethers.parseUnits('100000', 8))
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__FrequencyTimeLimitNotReached'
            );
          });
        });

        describe('mint Functionality Test', function () {
          it('mint props correctly.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            await test.connect(deployer).mint(address1.address, 1000000000000);

            let address_1_bal = await props.balanceOf(address1.address);
            assert.equal(address_1_bal.toString(), '1000000000000');
          });

          it('only minter can mint props.', async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            await expect(
              props.connect(deployer).mint(address1.address, 1000000000000)
            ).to.be.rejectedWith(
              `AccessControl: account ${deployer.address.toLowerCase()} is missing role ${ethers.keccak256(
                ethers.toUtf8Bytes('MINTER_ROLE')
              )}`
            );
          });

          it("can't mint more than mint_cap.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            await props.connect(deployer).changeLimiter(test_address);
            await test
              .connect(deployer)
              .setMintTrancheLimit(ethers.parseUnits('1000000', 8));

            for (let i = 0; i < 1200; i++) {
              await test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits('1000000', 8));

              await ethers.provider.send('evm_increaseTime', [172801]);
              await ethers.provider.send('evm_mine');
            }

            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits('1000000', 8))
            ).to.be.revertedWithCustomError(props, 'PROPS__MintCapReached');
          });

          it("can't mint more than mint tranche limit.", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits('1000000010', 8))
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__AmountTrancheLimitReached'
            );
          });

          it("can't mint before mint delay passed", async () => {
            let test_address = await test.getAddress();
            await props.connect(deployer).changeMinter(test_address);
            await test
              .connect(deployer)
              .mint(address1.address, ethers.parseUnits('10000', 8));

            await expect(
              test
                .connect(deployer)
                .mint(address1.address, ethers.parseUnits('10000', 8))
            ).to.be.revertedWithCustomError(
              props,
              'PROPS__FrequencyTimeLimitNotReached'
            );
          });
        });
      });
    });
