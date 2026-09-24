import type { Witnesses } from '../../contracts/managed/veil/contract/index.js';

export type PrivateState = {
  organizerSecret?: Uint8Array;
  invitationSecret?: Uint8Array;
};

export const witnesses: Witnesses<PrivateState> = {
  organizerSecret: ({ privateState }) => {
    if (!privateState.organizerSecret) throw new Error('Import your organizer recovery file first.');
    return [privateState, privateState.organizerSecret];
  },
  invitationSecret: ({ privateState }) => {
    if (!privateState.invitationSecret) throw new Error('Import your private invitation first.');
    return [privateState, privateState.invitationSecret];
  },
  membershipPath: ({ ledger, privateState }, leaf) => {
    const path = ledger.invitations.findPathForLeaf(leaf);
    if (!path) throw new Error('This invitation is not registered for this event. Contact the organizer.');
    return [privateState, path];
  },
};
