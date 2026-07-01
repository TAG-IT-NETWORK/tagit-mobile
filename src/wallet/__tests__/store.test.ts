import { useWalletStore } from "../store";

const A_EOA = "0x1111111111111111111111111111111111111111" as const;
const A_SMART = "0x2222222222222222222222222222222222222222" as const;

describe("wallet store", () => {
  beforeEach(() => useWalletStore.getState().disconnect());

  it("starts empty", () => {
    const s = useWalletStore.getState();
    expect(s.mode).toBeNull();
    expect(s.activeAddress).toBeNull();
  });

  it("embedded with smart account makes the smart account active", () => {
    useWalletStore.getState().setEmbedded(A_EOA, A_SMART);
    const s = useWalletStore.getState();
    expect(s.mode).toBe("embedded");
    expect(s.activeAddress).toBe(A_SMART);
    expect(s.status).toBe("ready");
  });

  it("embedded without smart account falls back to the EOA", () => {
    useWalletStore.getState().setEmbedded(A_EOA, null);
    expect(useWalletStore.getState().activeAddress).toBe(A_EOA);
  });

  it("connected uses the EOA as active", () => {
    useWalletStore.getState().setConnected(A_EOA);
    const s = useWalletStore.getState();
    expect(s.mode).toBe("connected");
    expect(s.activeAddress).toBe(A_EOA);
  });

  it("setSmartAccount promotes the active address for embedded mode", () => {
    useWalletStore.getState().setEmbedded(A_EOA, null);
    useWalletStore.getState().setSmartAccount(A_SMART, true);
    const s = useWalletStore.getState();
    expect(s.smartAccountAddress).toBe(A_SMART);
    expect(s.isAADeployed).toBe(true);
    expect(s.activeAddress).toBe(A_SMART);
  });

  it("disconnect resets to empty", () => {
    useWalletStore.getState().setConnected(A_EOA);
    useWalletStore.getState().disconnect();
    expect(useWalletStore.getState().activeAddress).toBeNull();
  });
});
