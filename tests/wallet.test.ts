import { describe, expect, it, vi } from "vitest";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import {
  discoverWallets,
  assertWalletNetwork,
  connectWallet,
  walletConnectionError,
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
    await expect(connectWallet(wallet)).rejects.toThrow("declined");
  });
  it("connects to Preview without asking a proof service or requesting a transaction", async () => {
    const api = {
      getConnectionStatus: vi.fn(async () => ({ status: "connected" })),
      getConfiguration: vi.fn(async () => ({ networkId: "preview" })),
      getShieldedAddresses: vi.fn(async () => ({
        shieldedAddress: "test-address",
      })),
    } as unknown as ConnectedAPI;
    const wallet = {
      name: "Lace",
      rdns: "test",
      icon: "",
      apiVersion: "4.0.1",
      connect: vi.fn(async () => api),
    };
    const stage = vi.fn();
    await expect(connectWallet(wallet, stage)).resolves.toMatchObject({
      address: "test-address",
      name: "Lace",
    });
    expect(wallet.connect).toHaveBeenCalledExactlyOnceWith("preview");
    expect(stage.mock.calls.flat()).toEqual([
      "permission",
      "network",
      "address",
    ]);
  });
  it.each([
    [
      {
        type: "DAppConnectorAPIError",
        code: "InvalidRequest",
        reason: "Unsupported network: preview",
      },
      "select the Preview network",
    ],
    [
      {
        type: "DAppConnectorAPIError",
        code: "PermissionRejected",
        reason: "No access",
      },
      "declined",
    ],
    [
      {
        type: "DAppConnectorAPIError",
        code: "Disconnected",
        reason: "Bridge unavailable",
      },
      "browser lost its connection",
    ],
    [new Error("Wallet is locked"), "unlock"],
    [new Error("Network request timed out"), "wallet did not respond"],
  ])(
    "explains connector failures without treating them as transaction failures",
    (error, message) => {
      const result = walletConnectionError(error, "permission");
      expect(result).toContain(message);
      expect(result).not.toContain("proof service did not respond");
      expect(result).not.toContain("If you approved a transaction");
    },
  );
  it("redacts unknown errors while identifying the failing connection step", () => {
    const result = walletConnectionError(
      { reason: "Network error: secret-material", code: "InternalError" },
      "address",
    );
    expect(result).toContain("reading your wallet address");
    expect(result).not.toContain("secret-material");
    expect(result).toContain("does not require a proof server");
  });
  it("does not query a wallet that responds after the connection timeout", async () => {
    vi.useFakeTimers();
    try {
      let resolve!: (api: ConnectedAPI) => void;
      const api = { getConnectionStatus: vi.fn() } as unknown as ConnectedAPI;
      const wallet = {
        name: "Lace",
        rdns: "test",
        icon: "",
        apiVersion: "4.0.1",
        connect: () =>
          new Promise<ConnectedAPI>((done) => {
            resolve = done;
          }),
      };
      const result = expect(connectWallet(wallet)).rejects.toThrow(
        "wallet did not respond",
      );
      await vi.advanceTimersByTimeAsync(60000);
      await result;
      resolve(api);
      await vi.advanceTimersByTimeAsync(1);
      expect(api.getConnectionStatus).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
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
