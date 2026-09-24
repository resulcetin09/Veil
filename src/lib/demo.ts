import {
  createCircuitContext,
  createConstructorContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  pureCircuits,
} from "../../contracts/managed/veil/contract/index.js";
import { witnesses, type PrivateState } from "../contract/witnesses";
import { randomSecret, toHex } from "./bytes";
import type { Receipt, EventState } from "./midnight";
import type { Invitation } from "./invitation";

/** Runs the actual generated circuit locally. No network, no proof generation, no wallet. */
export function createDemo() {
  const secret = randomSecret(),
    organizerSecret = randomSecret(),
    eventId = randomSecret();
  const key = "00".repeat(32),
    address = "01".repeat(32);
  const state: PrivateState = { invitationSecret: secret, organizerSecret };
  const contract = new Contract(witnesses);
  const initial = contract.initialState(
    createConstructorContext(state, key),
    eventId,
    pureCircuits.organizerCommitment(organizerSecret),
  );
  let context = createCircuitContext(
    address,
    key,
    initial.currentContractState,
    state,
  );
  // Four real local commitments, not a claimed count of real attendees.
  for (const member of [
    secret,
    randomSecret(),
    randomSecret(),
    randomSecret(),
  ]) {
    context = contract.impureCircuits.register(
      context,
      pureCircuits.invitationCommitment(eventId, member),
    ).context;
  }
  context = contract.impureCircuits.closeRegistration(context).context;
  const invitation: Invitation = {
    version: 1,
    kind: "veil-invitation",
    network: "preview",
    contractAddress: address,
    eventId: toHex(eventId),
    secret: toHex(secret),
    name: "Builders after dark",
  };
  return {
    invitation,
    inspect(): EventState {
      const value = ledger(context.currentQueryContext.state);
      return {
        count: Number(value.registered.size()),
        admitted: Number(value.admitted),
        open: value.registrationOpen,
        root: value.invitations.root().field.toString(16),
      };
    },
    redeem(): Receipt {
      const result = contract.impureCircuits.redeem(context);
      context = result.context;
      return {
        mode: "demo",
        txId: "local-circuit-execution",
        block: 0,
        nullifier: toHex(result.result),
      };
    },
  };
}
export type Demo = ReturnType<typeof createDemo>;
