const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery", () => {
  let lottery;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners(); // get the first account
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy();
  });

  it("deploys a contract", function () {
    expect(lottery.target).to.be.a("string");
  });

  it("returns the balance", async function () {
    expect(await lottery.getBalance()).to.equal(0);
  });

  it("returns the players", async function () {
    expect(await lottery.getPlayers()).to.be.an("array");
  });

  it("allows one account to enter", async function () {
    await lottery.connect(owner).enter({
      value: ethers.parseEther("0.1"),
    });

    const players = await lottery.getPlayers();
    expect(players[0]).to.equal(await owner.getAddress());
    expect(players).to.have.lengthOf(1);
  });

  it("allows multiple accounts to enter", async function () {
    await lottery.connect(owner).enter({ value: ethers.parseEther("0.1") });
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.1") });
    await lottery.connect(player2).enter({ value: ethers.parseEther("0.1") });

    const players = await lottery.getPlayers();

    expect(players[0]).to.equal(await owner.getAddress());
    expect(players[1]).to.equal(await player1.getAddress());
    expect(players[2]).to.equal(await player2.getAddress());
    expect(players).to.have.lengthOf(3);
  });

  it("requires a minimum amount of ether to enter", async function () {
    await expect(
      lottery.connect(owner).enter({
        value: ethers.parseEther("0.0001"),
      })
    ).to.be.revertedWith("Minimum entry fee is 0.01 ETH");
  });

  it("only manager can call pickWinner", async function () {
    await expect(lottery.connect(player1).pickWinner()).to.be.revertedWith(
      "Only manager can call this function"
    );
  });

  it("sends money to the winner and resets the players array", async function () {
    await lottery.connect(owner).enter({ value: ethers.parseEther("2") });

    const initialBalance = await ethers.provider.getBalance(owner.address);

    await lottery.connect(owner).pickWinner();

    const finalBalance = await ethers.provider.getBalance(owner.address);
    const difference = finalBalance - initialBalance;

    expect(difference).to.be.above(ethers.parseEther("1.8"));
  });

  it("resets the players array", async function () {
    await lottery.connect(owner).enter({ value: ethers.parseEther("2") });
    await lottery.connect(owner).pickWinner();

    const players = await lottery.getPlayers();
    expect(players).to.have.lengthOf(0);
  });

  it("resets the balance", async function () {
    await lottery.connect(owner).enter({ value: ethers.parseEther("2") });
    await lottery.connect(owner).pickWinner();

    const balance = await lottery.getBalance();
    expect(balance).to.equal(0);
  });

  it("does not allow entry with exactly 0.01 ETH", async function () {
    await expect(
      lottery.connect(player1).enter({
        value: ethers.parseEther("0.01"),
      })
    ).to.be.revertedWith("Minimum entry fee is 0.01 ETH");
  });

  it("allows same player to enter multiple times", async function () {
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.015") });
    await lottery.connect(player1).enter({ value: ethers.parseEther("0.015") });

    const players = await lottery.getPlayers();
    expect(players).to.have.lengthOf(2);
    expect(players[0]).to.equal(await player1.getAddress());
    expect(players[1]).to.equal(await player1.getAddress());
  });

  it("cannot pick winner if there are no players", async function () {
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No players in lottery"
    );
  });

  it("contract balance updates after entry", async function () {
    await lottery.connect(player1).enter({
      value: ethers.parseEther("0.015"),
    });

    const balance = await ethers.provider.getBalance(lottery.target);
    expect(balance).to.equal(ethers.parseEther("0.015"));
  });
});
