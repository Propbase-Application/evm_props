// We are going to skip a bit on these tests...

const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
//writing the test code from here..

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PROPS TESTS", function () {
      let props, deployer, address1, address2, address3;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        address1 = accounts[1];
        address2 = accounts[2];
        address3 = accounts[3];

        const Props = await ethers.getContractFactory("TEST_PROPS");
        props = await Props.deploy(
          address1.address,
          700000000000000,
          "www.icon.com"
        );
      });
      describe("TEST PROPS tests", function () {
        it("Initializes the PROPS Correctly.", async () => {
          const data = await props._iconURI();
          assert.equal(data, "www.icon.com");
          let user_bal = await props.balanceOf(address1.address);
          let decimals = await props.decimals();
          assert.equal(user_bal, 700000000000000);
          assert.equal(decimals, 8);
        });
      });
    });
