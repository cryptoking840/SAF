const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SAFMarketplace complete trade flow", function () {
  it("allows airline bid, supplier acceptance, and registry approval", async function () {
    const [registry, supplier, _inspector, airline] = await ethers.getSigners();

    const SAFMarketplace = await ethers.getContractFactory("SAFMarketplace");
    const marketplace = await SAFMarketplace.deploy();
    await marketplace.waitForDeployment();

    await (await marketplace.addSupplier(supplier.address)).wait();
    await (await marketplace.addAirline(airline.address)).wait();

    await (await marketplace.registerSAF(1000, supplier.address)).wait();

    await (await marketplace.connect(supplier).listCertificate(1)).wait();

    await (await marketplace.connect(airline).placeBid(1, 300, 1200)).wait();

    const bid = await marketplace.bids(1);
    expect(bid.certificateId).to.equal(1n);
    expect(bid.quantity).to.equal(300n);
    expect(bid.accepted).to.equal(false);

    await (await marketplace.connect(supplier).acceptBid(1)).wait();

    const acceptedBid = await marketplace.bids(1);
    expect(acceptedBid.accepted).to.equal(true);

    await (await marketplace.approveTrade(1)).wait();

    const parent = await marketplace.certificates(1);
    const child = await marketplace.certificates(2);

    expect(parent.remainingQuantity).to.equal(700n);
    expect(child.parentId).to.equal(1n);
    expect(child.owner).to.equal(airline.address);
    expect(child.originalQuantity).to.equal(300n);
  });
});
