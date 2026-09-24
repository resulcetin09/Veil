# Product proposal — Veil

**Programme:** Rise In, Midnight Level 3  
**Provided-list category:** Private Allowlist Access  
**Approval status:** Prepared for submission; external organizer approval is not yet recorded.

## Problem

Event and community admission systems commonly publish wallet allowlists or collect names and emails just to answer one question: does this person have an invitation? This exposes more information than the access decision needs and makes participation easier to correlate.

## Proposed product

Veil gives each invited guest a random bearer secret. The organizer registers a commitment on Midnight and seals the list. A guest proves membership in that fixed set without publishing the secret or selecting a visible membership leaf, then receives a confirmed access receipt. A contract-enforced nullifier prevents repeated admission.

## Target users

Small developer communities, private workshops and invitation-only gatherings that want publicly verifiable membership checks without a public list of guest identities.

## Submission scope

- One event per Compact deployment, up to 1,024 invitations.
- Organizer deployment, recovery file, invitation issuance and permanent sealing.
- Guest wallet connection, private invitation import, proof generation, approval, confirmation and repeat-use rejection.
- Explicit privacy explanation, responsive interface, automated tests and compile/test/build CI/CD.

## Why Midnight

Compact witnesses and zero-knowledge circuits make the membership leaf and Merkle path private while a public root and nullifier support verification. A conventional public allowlist lookup would reveal the queried membership entry. Veil’s redemption circuit never performs that public lookup.

## Success criteria

One invited guest succeeds; a non-member, forged witness and already-used invitation fail. The final public transcript includes the root and nullifier, not the invitation secret or membership leaf. At least three meaningful tests pass, CI runs publicly, the frontend is live, and the repository contains at least ten meaningful commits plus a one-minute real-network demonstration.

## Honest boundaries

The organizer generates and can retain secrets, so this is privacy from public observers, not anonymity from the organizer. Invitations can be transferred by sharing the file. Timing and small anonymity sets can leak information. The local proof server is trusted with witness data. No identity attestation, payment product or mainnet security claim is made.

## Next stage

Guest-generated commitments and blind issuance could reduce organizer correlation. Other future work includes encrypted recovery, event discovery, revocation design, checkpoint receipts and an independent security review. These are intentionally outside this submission.

## Approval request text

I propose **Veil**, a Private Allowlist Access dApp on Midnight. Organizers commit invitation credentials to a Merkle tree and seal the guest list. Guests prove membership without publishing their invitation or selected allowlist entry. Event-scoped nullifiers prevent reuse. The submission includes real Compact circuits, wallet integration, contract/application/browser tests, CI/CD and a clear privacy model. The organizer trust boundary and bearer-credential limitations are explicitly documented. Please confirm this scope fits the Level 3 approved idea list.
