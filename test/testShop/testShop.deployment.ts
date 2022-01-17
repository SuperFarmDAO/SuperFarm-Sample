import { expect } from "chai";

export function shouldDeployCorrectly(): void {
    it("should deploy correctly", async function () {
        expect(await this.paymentToken.name()).to.be.equal("testToken");
        expect(await this.paymentToken.symbol()).to.be.equal("TKN");
        expect(await this.paymentToken.decimals()).to.be.equal(18);
        expect(await this.tradeToken.uri(1)).to.be.equal("");
        expect(await this.instance.name()).to.be.equal("newShop")
        expect(await this.instance.feeOwner()).to.be.eq(this.carl.address)
        expect(await this.instance.feePercent()).to.be.eq(4000)
        expect(await this.instance.royaltyOwner()).to.be.eq(this.dan.address)
        expect(await this.instance.itemRoyaltyPercent()).to.be.eq(3000)
    });
}