// We are going to skip a bit on these tests...

const { assert, expect } = require('chai');
const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { isAwaitExpression } = require('typescript');
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('PROPS TESTS', function () {
      let props,
        test,
        deployer,
        address1,
        address2,
        address3,
        test1,
        treasury_address;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        address1 = accounts[1];
        address2 = accounts[2];
        address3 = accounts[3];

        const Props = await ethers.getContractFactory('PROPS');
        const Test = await ethers.getContractFactory('TEST');
        props = await Props.deploy(ethers.parseUnits('2000000', 8));
        let props_address = await props.getAddress();
        test = await Test.deploy(props_address);
        test1 = await Test.deploy(props_address);

        const treasury = await Test.deploy(deployer.address);
        treasury_address = await treasury.getAddress();
        const constractTreasury = await props.treasury();
        assert.equal(constractTreasury, 0x0);
        await props.connect(deployer).changeTreasury(treasury_address);
      });
      describe('Basic Functionality Test', function () {
        it('Initializes the PROPS Correctly.', async () => {
          const current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.toBigInt('0'));
          const mint_tranche_limit = await props.mint_tranche_limit();
          assert.equal(mint_tranche_limit, ethers.toBigInt('200000000000000'));
          const last_mint_timestamp = await props.last_mint_timestamp();
          assert.equal(last_mint_timestamp, ethers.toBigInt('0'));
          const last_mint_tranche_timestamp =
            await props.last_mint_tranche_timestamp();
          assert.equal(last_mint_tranche_timestamp, ethers.toBigInt('0'));
          const admin = await props.admin();
          assert.equal(admin, deployer.address);
          const minter = await props.minter();
          assert.equal(minter, 0x0);
          const limiter = await props.limiter();
          assert.equal(limiter, 0x0);

          const admin_addr = await props.getRoleAdmin(
            ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'))
          );
          assert(admin_addr, deployer.address);

          const decimals = await props.decimals();
          assert(decimals, 8);
        });
      });

      describe('changeAdmin', function () {
        it('Sets admin correctly.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeAdmin(test_address);
          let newAdminHasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              test_address
            );
          assert(newAdminHasRole);
        });

        it('Old admin is revoked.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeAdmin(test_address);
          let newAdminHasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              test_address
            );
          assert(newAdminHasRole);
          let oldAdminHasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              deployer.address
            );
          assert(!oldAdminHasRole);
          const admin = await props.admin();
          assert.equal(admin, test_address);
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

        it("admin can't set single sign address.", async () => {
          await expect(
            props.connect(deployer).changeAdmin(address2.address)
          ).to.be.revertedWithCustomError(props, 'PROPS__AddressNotMultiSign');
        });
      });

      describe('revokeAdmin', function () {
        it('Revokes admin correctly.', async () => {
          await props.connect(deployer).revokeAdmin(deployer.address);
          let hasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              deployer.address
            );
          assert(!hasRole);
          const admin = await props.admin();
          assert.equal(admin, 0x0);
        });

        it('Emits AdminRevoked correctly on revoke admin.', async () => {
          const timestamp = await time.latest();
          await expect(props.connect(deployer).revokeAdmin(deployer.address))
            .to.emit(props, 'AdminRevoked')
            .withArgs(deployer.address, timestamp + 1);
        });

        it("Revokes admin can't set zero address.", async () => {
          await expect(
            props.connect(deployer).revokeAdmin(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
        });
      });

      describe('changeLimiter', function () {
        it('Sets limiter correctly.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeLimiter(test_address);
          let hasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
              test_address
            );
          assert(hasRole);

          const newLimiter = await props.limiter();
          assert.equal(newLimiter, test_address);
        });

        it('Sets limiter twice.', async () => {
          let test_address = await test.getAddress();
          const oldLimiter = await props.limiter();
          assert.equal(oldLimiter, 0x0);
          await props.connect(deployer).changeLimiter(test_address);
          let hasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
              test_address
            );
          assert(hasRole);

          const newLimiter = await props.limiter();
          assert.equal(newLimiter, test_address);

          let test_address_1 = await test1.getAddress();
          await props.connect(deployer).changeLimiter(test_address_1);
          let hasRole1 = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
              test_address_1
            );
          assert(hasRole1);

          const newLimiter1 = await props.limiter();
          assert.equal(newLimiter1, test_address_1);
        });

        it('Emits LimiterChanged on limiter correctly.', async () => {
          const timestamp = await time.latest();
          let test_address = await test.getAddress();
          await expect(props.connect(deployer).changeLimiter(test_address))
            .to.emit(props, 'LimiterChanged')
            .withArgs(test_address, timestamp + 1);
        });

        it('Only admin can setup limiter.', async () => {
          let test_address = await test.getAddress();
          await expect(
            props.connect(address2).changeLimiter(test_address)
          ).to.be.rejectedWith(
            `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
              ethers.toUtf8Bytes('ADMIN_ROLE')
            )}`
          );
        });

        it("admin can't setup zero address limiter.", async () => {
          await expect(
            props.connect(deployer).changeLimiter(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
        });

        it("admin can't set single sign address with limiter role.", async () => {
          await expect(
            props.connect(deployer).changeLimiter(address1.address)
          ).to.be.revertedWithCustomError(props, 'PROPS__AddressNotMultiSign');
        });
      });

      describe('changeMinter', function () {
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
          const newMinter = await props.minter();
          assert.equal(newMinter, test_address);
        });

        it('Sets minter twice.', async () => {
          let test_address = await test.getAddress();
          const oldMinter = await props.minter();
          assert.equal(oldMinter, 0x0);
          await props.connect(deployer).changeMinter(test_address);
          let hasRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
              test_address
            );
          assert(hasRole);

          const newMinter = await props.minter();
          assert.equal(newMinter, test_address);

          let test_address_1 = await test1.getAddress();
          await props.connect(deployer).changeMinter(test_address_1);
          let hasRole1 = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
              test_address_1
            );
          assert(hasRole1);

          const newMinter1 = await props.minter();
          assert.equal(newMinter1, test_address_1);
        });

        it('Emits MinterChanged on minter correctly.', async () => {
          const timestamp = await time.latest();
          let test_address = await test.getAddress();
          await expect(props.connect(deployer).changeMinter(test_address))
            .to.emit(props, 'MinterChanged')
            .withArgs(test_address, timestamp + 1);
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

        it("admin can't set single sign address with minter role.", async () => {
          await expect(
            props.connect(deployer).changeMinter(address1.address)
          ).to.be.revertedWithCustomError(props, 'PROPS__AddressNotMultiSign');
        });
      });

      describe('changeTreasury', function () {
        it('Sets treasury correctly.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeTreasury(test_address);
          const newTreasury = await props.treasury();
          assert.equal(newTreasury, test_address);
        });

        it('Sets treasury twice.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeTreasury(test_address);

          const newTreasury = await props.treasury();
          assert.equal(newTreasury, test_address);

          let test_address_1 = await test1.getAddress();
          await props.connect(deployer).changeTreasury(test_address_1);

          const newTreasury1 = await props.treasury();
          assert.equal(newTreasury1, test_address_1);
        });

        it('Emits TreasuryChanged on treasury correctly.', async () => {
          const timestamp = await time.latest();
          let test_address = await test.getAddress();
          await expect(props.connect(deployer).changeTreasury(test_address))
            .to.emit(props, 'TreasuryChanged')
            .withArgs(test_address, timestamp + 1);
        });

        it('Only admin can setup treasury.', async () => {
          let test_address = await test.getAddress();
          await expect(
            props.connect(address2).changeTreasury(test_address)
          ).to.be.rejectedWith(
            `AccessControl: account ${address2.address.toLowerCase()} is missing role ${ethers.keccak256(
              ethers.toUtf8Bytes('ADMIN_ROLE')
            )}`
          );
        });

        it("admin can't setup zero address treasury.", async () => {
          await expect(
            props.connect(deployer).changeTreasury(ethers.ZeroAddress)
          ).to.be.revertedWithCustomError(props, 'PROPS__InvalidAddress');
        });

        it("admin can't set single sign address with treasury role.", async () => {
          await expect(
            props.connect(deployer).changeTreasury(address1.address)
          ).to.be.revertedWithCustomError(props, 'PROPS__AddressNotMultiSign');
        });
      });

      describe('setMintTrancheLimit Functionality Test', function () {
        it('Sets MintTrancheLimit correctly.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeLimiter(test_address);
          await test
            .connect(deployer)
            .setMintTrancheLimit(ethers.parseUnits('5', 8));

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.toBigInt('500000000'));
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

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.parseUnits('10000', 8));
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
          await test.connect(deployer).mint(1000000000000);

          let address_1_bal = await props.balanceOf(treasury_address);
          assert.equal(address_1_bal.toString(), '1000000000000');
        });

        it('only minter can mint props.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeMinter(test_address);
          await expect(
            props.connect(deployer).mint(1000000000000)
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
            await test.connect(deployer).mint(ethers.parseUnits('1000000', 8));

            await ethers.provider.send('evm_increaseTime', [172801]);
            await ethers.provider.send('evm_mine');
          }

          await expect(
            test.connect(deployer).mint(ethers.parseUnits('1000000', 8))
          ).to.be.revertedWithCustomError(props, 'PROPS__MintCapReached');
        });

        it("can't mint more than mint tranche limit.", async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeMinter(test_address);
          await expect(
            test.connect(deployer).mint(ethers.parseUnits('1000000010', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__AmountTrancheLimitReached'
          );
        });

        it("can't mint before mint delay passed", async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeMinter(test_address);
          await test.connect(deployer).mint(ethers.parseUnits('10000', 8));

          await expect(
            test.connect(deployer).mint(ethers.parseUnits('10000', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__FrequencyTimeLimitNotReached'
          );
        });
      });

      describe('Full Flow Test', function () {
        it('All functions works properly together.', async () => {
          let test_address = await test.getAddress();
          await props.connect(deployer).changeMinter(test_address);
          await props.connect(deployer).changeLimiter(test_address);
          await props.connect(deployer).revokeAdmin(deployer.address);

          let hasMinterRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
              test_address
            );
          let hasLimiterRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
              test_address
            );
          let hasAdminRole = await props
            .connect(deployer)
            .hasRole(
              ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
              deployer.address
            );

          assert(hasMinterRole);
          assert(hasLimiterRole);
          assert(!hasAdminRole);

          for (let i = 0; i < 4; i++) {
            await test.connect(deployer).mint(ethers.parseUnits('2000000', 8));

            const current_timestamp = await time.latest();
            let mint_timestamp = await props.last_mint_timestamp();

            assert.equal(current_timestamp, mint_timestamp);
            await ethers.provider.send('evm_increaseTime', [172801]);
            await ethers.provider.send('evm_mine');
          }

          let current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.parseUnits('8000000', 8));

          await test
            .connect(deployer)
            .setMintTrancheLimit(ethers.parseUnits('1000000', 8));

          const current_timestamp = await time.latest();

          let mint_tranche_timestamp =
            await props.last_mint_tranche_timestamp();
          assert.equal(
            ethers.toBigInt(current_timestamp),
            mint_tranche_timestamp
          );

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.parseUnits('1000000', 8));

          let address_1_bal = await props.balanceOf(treasury_address);
          assert.equal(address_1_bal.toString(), '800000000000000');
        });
      });
    });
describe('Full Flow Test 2', function () {
  let Test;
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    address1 = accounts[1];
    address2 = accounts[2];
    address3 = accounts[3];

    const Props = await ethers.getContractFactory('PROPS');
    Test = await ethers.getContractFactory('TEST');
    props = await Props.deploy(ethers.parseUnits('15000000', 8));
    let props_address = await props.getAddress();
    test = await Test.deploy(props_address);
    test1 = await Test.deploy(props_address);
  });

  it('All functions works properly together.', async () => {
    let test_address = await test.getAddress();
    await props.connect(deployer).changeMinter(test_address);
    await props.connect(deployer).changeLimiter(test_address);

    const treasury = await Test.deploy(deployer.address);
    let treasury_address = await treasury.getAddress();
    await props.connect(deployer).changeTreasury(treasury_address);

    let hasMinterRole = await props
      .connect(deployer)
      .hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
        test_address
      );
    let hasLimiterRole = await props
      .connect(deployer)
      .hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('LIMITER_ROLE')),
        test_address
      );

    assert(hasMinterRole);
    assert(hasLimiterRole);

    await test.connect(deployer).mint(ethers.parseUnits('15000000', 8));

    const current_timestamp = await time.latest();
    let mint_timestamp = await props.last_mint_timestamp();

    assert.equal(current_timestamp, mint_timestamp);

    let current_supply = await props.current_supply();
    assert.equal(current_supply, ethers.parseUnits('15000000', 8));

    await test
      .connect(deployer)
      .setMintTrancheLimit(ethers.parseUnits('1000000', 8));

    const current_timestamp2 = await time.latest();

    let mint_tranche_timestamp = await props.last_mint_tranche_timestamp();
    assert.equal(ethers.toBigInt(current_timestamp2), mint_tranche_timestamp);

    const data = await props.mint_tranche_limit();
    assert.equal(data, ethers.parseUnits('1000000', 8));

    let address_1_bal = await props.balanceOf(treasury_address);
    assert.equal(address_1_bal.toString(), '1500000000000000');

    await props.connect(deployer).revokeAdmin(deployer.address);
    let hasAdminRole = await props
      .connect(deployer)
      .hasRole(
        ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
        deployer.address
      );
    assert(!hasAdminRole);
  });
});
