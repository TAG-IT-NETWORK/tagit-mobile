jest.mock("../../onchain/clients", () => ({ getPublicClient: jest.fn() }));
import { readOnChainAsset } from "../useOnChainOwner";
import { getPublicClient } from "../../onchain/clients";

const OWNER = "0x3Ed1b3e5a1eCe81891Bde8e6821029305eB0F113";

describe("readOnChainAsset", () => {
  it("returns the full checksummed owner and the numeric state from getAsset", async () => {
    const readContract = jest.fn(async () => [OWNER, 1757500000n, 4, 0, 0]);
    (getPublicClient as jest.Mock).mockReturnValue({ readContract });
    const a = await readOnChainAsset("43");
    expect(a).toEqual({ owner: OWNER, stateCode: 4 });
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: "getAsset", args: [43n] }));
  });
  it("propagates RPC failures (the hook turns them into null)", async () => {
    (getPublicClient as jest.Mock).mockReturnValue({ readContract: jest.fn(async () => { throw new Error("rpc down"); }) });
    await expect(readOnChainAsset("43")).rejects.toThrow("rpc down");
  });
});
