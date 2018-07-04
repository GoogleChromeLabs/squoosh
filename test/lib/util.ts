import {bitmapToImageData} from "../../src/lib/util";

const expect = chai.expect;

describe("util.bitmapToImageData", function () {
  it("is a function", function () {
    expect(bitmapToImageData).to.be.a('function');
  });
});
