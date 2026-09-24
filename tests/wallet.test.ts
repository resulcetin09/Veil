import { describe, expect, it, vi } from "vitest";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import {
  discoverWallets,
  assertWalletNetwork,
  connectWallet,
} from "../src/lib/wallet";
import { memoryPrivateState } from "../src/lib/private-state";

describe("Wallet and private session", () => {
  it("ignores incompatible and malformed injected wallets", () => {
    const valid = { name: "Lace", apiVersion: "4.0.1", connect: vi.fn() };
    expect(
      discoverWallets({
        valid,
        legacy: { ...valid, apiVersion: "3.0" },
        bad: {},
        empty: null,
      }),
    ).toEqual([valid]);
  });
  it("rejects a wrong network even if the wallet accepted the connection hint", async () => {
    const api = {
      getConnectionStatus: async () => ({ status: "connected" }),
      getConfiguration: async () => ({ networkId: "mainnet" }),
    } as unknown as ConnectedAPI;
    await expect(assertWalletNetwork(api)).rejects.toThrow("Preview");
  });
  it("does not consider a revoked connection valid", async () => {
    const api = {
      getConnectionStatus: async () => ({ status: "disconnected" }),
    } as unknown as ConnectedAPI;
    await expect(assertWalletNetwork(api)).rejects.toThrow("disconnected");
  });
  it("propagates user rejection without fabricating a connected session", async () => {
    const wallet = {
      name: "Lace",
      rdns: "test",
      icon: "",
      apiVersion: "4.0.1",
      connect: async () => {
        throw new Error("User rejected");
      },
    };
    await expect(connectWallet(wallet)).rejects.toThrow("rejected");
  });
  it("scopes private state by contract and clears all session material", async () => {
    const store = memoryPrivateState();
    await expect(store.get("guest")).rejects.toThrow("scope");
    store.setContractAddress("01".repeat(32));
    await store.set("guest", { invitationSecret: new Uint8Array([1]) });
    store.setContractAddress("02".repeat(32));
    expect(await store.get("guest")).toBeNull();
    store.setContractAddress("01".repeat(32));
    const copy = await store.get("guest");
    copy!.invitationSecret![0] = 9;
    expect((await store.get("guest"))!.invitationSecret![0]).toBe(1);
    await store.clear();
    expect(await store.get("guest")).toBeNull();
  });
});
