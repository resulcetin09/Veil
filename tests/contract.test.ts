import { describe, expect, it } from "vitest";
import {
  createCircuitContext,
  createConstructorContext,
  type CircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  pureCircuits,
  type Witnesses,
} from "../contracts/managed/veil/contract/index.js";
import { witnesses, type PrivateState } from "../src/contract/witnesses";
import { toHex } from "../src/lib/bytes";

const bytes = (n: number) => new Uint8Array(32).fill(n);
const admin = bytes(1),
  guest = bytes(2),
  event = bytes(3);
const coinKey = "00".repeat(32),
  address = "01".repeat(32);

function setup(custom: Witnesses<PrivateState> = witnesses, id = event) {
  const contract = new Contract(custom);
  const ps: PrivateState = { organizerSecret: admin, invitationSecret: guest };
  const initial = contract.initialState(
    createConstructorContext(ps, coinKey),
    id,
    pureCircuits.organizerCommitment(admin),
  );
  let context = createCircuitContext(
    address,
    coinKey,
    initial.currentContractState,
    ps,
  );
  return {
    contract,
    get context() {
      return context;
    },
    set context(value: CircuitContext<PrivateState>) {
      context = value;
    },
    get state() {
      return ledger(context.currentQueryContext.state);
    },
    register(secret = guest) {
      context = contract.impureCircuits.register(
        context,
        pureCircuits.invitationCommitment(id, secret),
      ).context;
    },
    close() {
      context = contract.impureCircuits.closeRegistration(context).context;
    },
    redeem() {
      const result = contract.impureCircuits.redeem(context);
      context = result.context;
      return result;
    },
  };
}

describe("Veil — compiled Compact contract", () => {
  it("admits a registered invitation and publishes its event-scoped nullifier", () => {
    const app = setup();
    app.register();
    app.close();
    expect(app.redeem().result).toEqual(
      pureCircuits.invitationNullifier(event, guest),
    );
    expect(app.state.admitted).toBe(1n);
  });
  it("rejects a second redemption without incrementing the count", () => {
    const app = setup();
    app.register();
    app.close();
    app.redeem();
    expect(() => app.redeem()).toThrow("Invitation already redeemed");
    expect(app.state.admitted).toBe(1n);
  });
  it("rejects an unregistered invitation", () => {
    const app = setup();
    app.register();
    app.close();
    app.context = {
      ...app.context,
      currentPrivateState: { invitationSecret: bytes(9) },
    };
    expect(() => app.redeem()).toThrow("not registered");
  });
  it("rejects a malicious witness that supplies another guest’s valid path", () => {
    const app = setup({
      ...witnesses,
      membershipPath: ({ ledger, privateState }) => [
        privateState,
        ledger.invitations.findPathForLeaf(
          pureCircuits.invitationCommitment(event, guest),
        )!,
      ],
    });
    app.register();
    app.close();
    app.context = {
      ...app.context,
      currentPrivateState: { invitationSecret: bytes(9) },
    };
    expect(() => app.redeem()).toThrow(
      "Membership path does not match invitation",
    );
  });
  it("rejects a forged sibling even when the leaf matches", () => {
    const app = setup({
      ...witnesses,
      membershipPath: (ctx, leaf) => {
        const path = ctx.ledger.invitations.findPathForLeaf(leaf)!;
        return [
          ctx.privateState,
          {
            ...path,
            path: path.path.map((p, i) =>
              i === 0 ? { ...p, sibling: { field: p.sibling.field + 1n } } : p,
            ),
          },
        ];
      },
    });
    app.register();
    app.close();
    expect(() => app.redeem()).toThrow("Invitation is not on the allowlist");
  });
  it("rejects unauthorized registration and closing", () => {
    const app = setup();
    app.context = {
      ...app.context,
      currentPrivateState: { organizerSecret: bytes(8) },
    };
    expect(() => app.register()).toThrow("Organizer authorization required");
    expect(() => app.close()).toThrow("Organizer authorization required");
  });
  it("rejects duplicate commitments", () => {
    const app = setup();
    app.register();
    expect(() => app.register()).toThrow("Invitation already registered");
  });
  it("freezes the allowlist before allowing redemption", () => {
    const app = setup();
    app.register();
    expect(() => app.redeem()).toThrow("Registration must close");
    app.close();
    expect(() => app.register(bytes(5))).toThrow("Registration is closed");
    expect(() => app.close()).toThrow("Registration is already closed");
  });
  it("domain-separates commitments, nullifiers and events", () => {
    const leaf = pureCircuits.invitationCommitment(event, guest);
    const nul = pureCircuits.invitationNullifier(event, guest);
    expect(leaf).not.toEqual(nul);
    expect(nul).not.toEqual(pureCircuits.invitationNullifier(bytes(4), guest));
    expect(leaf).not.toEqual(
      pureCircuits.invitationCommitment(bytes(4), guest),
    );
  });
  it("does not expose the private invitation secret or membership leaf in the redemption public transcript", () => {
    const app = setup();
    app.register();
    app.register(bytes(4));
    app.close();
    const result = app.redeem();
    const transcript = JSON.stringify(
      result.proofData.publicTranscript,
      (_, value) =>
        value instanceof Uint8Array
          ? toHex(value)
          : typeof value === "bigint"
            ? value.toString()
            : value,
    );
    expect(transcript).toContain(toHex(result.result));
    expect(transcript).not.toContain(toHex(guest));
    expect(transcript).not.toContain(
      toHex(pureCircuits.invitationCommitment(event, guest)),
    );
  });
});
