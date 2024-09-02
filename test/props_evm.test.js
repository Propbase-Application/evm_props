// We are going to skip a bit on these tests...

const { assert, expect } = require('chai');
const { ethers, network } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('PROPS TESTS', function () {
      let props,
        deployer,
        multiSignaddress,
        treasurySigner,
        minterSigner,
        limiterSigner,
        multisignSigner;
      let treasury = '0x068121C6be050Cd9a20105d9133FE26ab3971b46';
      let minter = '0x401518a18849185b49097EeAf5690f6825190068';
      let limiter = '0xAF48d53c8b33A98390Fa52A906fD57Fad7B84a5E';
      let multisign = '0x6b9a6477df9b96dda4cdf686845612998a1f8825';

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];

        const Props = await ethers.getContractFactory('PROPS');
        props = await Props.deploy(ethers.parseUnits('2000000', 8));
        await network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [treasury],
        });
        treasurySigner = await ethers.getSigner(treasury);

        await network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [minter],
        });
        minterSigner = await ethers.getSigner(minter);

        await network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [limiter],
        });
        limiterSigner = await ethers.getSigner(limiter);

        await network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [multisign],
        });
        multisignSigner = await ethers.getSigner(multisign);

        topupEth(treasurySigner);
        topupEth(minterSigner);
        topupEth(limiterSigner);
        topupEth(multisignSigner);
      });

      const topupEth = async (user) => {
        const amount = ethers.parseEther('10.0');
        const tx = await deployer.sendTransaction({
          to: user,
          value: amount,
        });

        // Wait for the transaction to be mined
        await tx.wait();
      };

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

          const decimals = await props.decimals();
          assert(decimals, 8);
        });
      });

      describe('setMintTrancheLimit', function () {
        it('Sets MintTrancheLimit correctly.', async () => {
          await props
            .connect(limiterSigner)
            .setMintTrancheLimit(ethers.parseUnits('5', 8));

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.toBigInt('500000000'));
        });

        it('Emits MintTrancheLimitSetup on MintTrancheLimit correctly.', async () => {
          const timestamp = await time.latest();
          await expect(
            await props
              .connect(limiterSigner)
              .setMintTrancheLimit(ethers.parseUnits('5', 8))
          )
            .to.emit(props, 'MintTrancheLimitSetup')
            .withArgs(limiter, ethers.parseUnits('5', 8), timestamp + 1);
        });

        it('only limiter role can set MintTrancheLimit ', async () => {
          await expect(
            props
              .connect(multisignSigner)
              .setMintTrancheLimit(ethers.parseUnits('12000000', 8))
          ).to.be.rejectedWith(
            `VM Exception while processing transaction: reverted with custom error 'PROPS__NOT_ATHOURISED()`
          );
        });

        it("can't set MintTrancheLimit > mint_cap.", async () => {
          await expect(
            props
              .connect(limiterSigner)
              .setMintTrancheLimit(ethers.parseUnits('12000000000', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__MintTrancheLimitOutOfRange'
          );
        });

        it("can't set MintTrancheLimit > min_tranche_limit.", async () => {
          await expect(
            props
              .connect(limiterSigner)
              .setMintTrancheLimit(ethers.parseUnits('1000000000', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__MintTrancheLimitOutOfRange'
          );
        });

        it('can set MintTrancheLimit multiple times after mint_delay', async () => {
          await props
            .connect(limiterSigner)
            .setMintTrancheLimit(ethers.parseUnits('1000', 8));

          const data = await props.mint_tranche_limit();
          assert.equal(data, ethers.parseUnits('1000', 8));
          await ethers.provider.send('evm_increaseTime', [172801]);
          await ethers.provider.send('evm_mine');

          await props
            .connect(limiterSigner)
            .setMintTrancheLimit(ethers.parseUnits('2000', 8));

          const data1 = await props.mint_tranche_limit();
          assert.equal(data1, ethers.parseUnits('2000', 8));
        });

        it("can't set MintTrancheLimit multiple times without mint_delay", async () => {
          await props
            .connect(limiterSigner)
            .setMintTrancheLimit(ethers.parseUnits('100000', 8));

          await expect(
            props
              .connect(limiterSigner)
              .setMintTrancheLimit(ethers.parseUnits('100000', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__FrequencyTimeLimitNotReached'
          );
        });
      });

      describe('mint', function () {
        it('mint props correctly.', async () => {
          await props.connect(minterSigner).mint(1000000000000);

          let address_1_bal = await props.balanceOf(treasury);
          assert.equal(address_1_bal.toString(), '1000000000000');

          const current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.toBigInt('1000000000000'));
        });

        it('only minter can mint props.', async () => {
          await expect(
            props.connect(deployer).mint(1000000000000)
          ).to.be.rejectedWith(
            `VM Exception while processing transaction: reverted with custom error 'PROPS__NOT_ATHOURISED()`
          );
        });

        it("can't mint more than mint_cap.", async () => {
          await props
            .connect(limiterSigner)
            .setMintTrancheLimit(ethers.parseUnits('1000000', 8));

          for (let i = 0; i < 1200; i++) {
            await props
              .connect(minterSigner)
              .mint(ethers.parseUnits('1000000', 8));

            await ethers.provider.send('evm_increaseTime', [172801]);
            await ethers.provider.send('evm_mine');
          }

          await expect(
            props.connect(minterSigner).mint(ethers.parseUnits('1000000', 8))
          ).to.be.revertedWithCustomError(props, 'PROPS__MintCapReached');
        });

        it("can't mint more than mint tranche limit.", async () => {
          await expect(
            props.connect(minterSigner).mint(ethers.parseUnits('1000000010', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__AmountTrancheLimitReached'
          );
        });

        it("can't mint before mint delay passed", async () => {
          await props.connect(minterSigner).mint(ethers.parseUnits('10000', 8));

          await expect(
            props.connect(minterSigner).mint(ethers.parseUnits('10000', 8))
          ).to.be.revertedWithCustomError(
            props,
            'PROPS__FrequencyTimeLimitNotReached'
          );
        });

        it('Emits PropsMinted on mint correctly.', async () => {
          const timestamp = await time.latest();
          await expect(
            await props
              .connect(minterSigner)
              .mint(ethers.parseUnits('10000', 8))
          )
            .to.emit(props, 'PropsMinted')
            .withArgs(
              minter,
              treasury,
              ethers.parseUnits('10000', 8),
              timestamp + 5,
              await props.current_supply()
            );
        });
      });

      describe('Full Flow Test', function () {
        it('All functions works properly together.', async () => {
          for (let i = 0; i < 4; i++) {
            await props
              .connect(minterSigner)
              .mint(ethers.parseUnits('2000000', 8));

            const current_timestamp = await time.latest();
            let mint_timestamp = await props.last_mint_timestamp();

            assert.equal(current_timestamp, mint_timestamp);
            await ethers.provider.send('evm_increaseTime', [172801]);
            await ethers.provider.send('evm_mine');
          }

          let current_supply = await props.current_supply();
          assert.equal(current_supply, ethers.parseUnits('8000000', 8));

          await props
            .connect(limiterSigner)
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

          let address_1_bal = await props.balanceOf(treasury);
          assert.equal(address_1_bal.toString(), '800000000000000');
        });
      });
    });
describe('Full Flow Test 2', function () {
  let props,
    deployer,
    multiSignaddress,
    treasurySigner,
    minterSigner,
    limiterSigner,
    multisignSigner;
  let treasury = '0x068121C6be050Cd9a20105d9133FE26ab3971b46';
  let minter = '0x401518a18849185b49097EeAf5690f6825190068';
  let limiter = '0xAF48d53c8b33A98390Fa52A906fD57Fad7B84a5E';
  let multisign = '0x6b9a6477df9b96dda4cdf686845612998a1f8825';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];

    const Props = await ethers.getContractFactory('PROPS');
    props = await Props.deploy(ethers.parseUnits('15000000', 8));
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [treasury],
    });
    treasurySigner = await ethers.getSigner(treasury);

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [minter],
    });
    minterSigner = await ethers.getSigner(minter);

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [limiter],
    });
    limiterSigner = await ethers.getSigner(limiter);

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [multisign],
    });
    multisignSigner = await ethers.getSigner(multisign);

    topupEth(treasurySigner);
    topupEth(minterSigner);
    topupEth(limiterSigner);
    topupEth(multisignSigner);
  });

  const topupEth = async (user) => {
    const amount = ethers.parseEther('10.0');
    const tx = await deployer.sendTransaction({
      to: user,
      value: amount,
    });

    // Wait for the transaction to be mined
    await tx.wait();
  };

  it('All functions works properly together.', async () => {
    await props.connect(minterSigner).mint(ethers.parseUnits('15000000', 8));

    const current_timestamp = await time.latest();
    let mint_timestamp = await props.last_mint_timestamp();

    assert.equal(current_timestamp, mint_timestamp);

    let current_supply = await props.current_supply();
    assert.equal(current_supply, ethers.parseUnits('15000000', 8));

    await props
      .connect(limiterSigner)
      .setMintTrancheLimit(ethers.parseUnits('1000000', 8));

    const current_timestamp2 = await time.latest();

    let mint_tranche_timestamp = await props.last_mint_tranche_timestamp();
    assert.equal(ethers.toBigInt(current_timestamp2), mint_tranche_timestamp);

    const data = await props.mint_tranche_limit();
    assert.equal(data, ethers.parseUnits('1000000', 8));

    let address_1_bal = await props.balanceOf(treasury);
    assert.equal(address_1_bal.toString(), '1500000000000000');
  });
});
