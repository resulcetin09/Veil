# Veil — Private Allowlist Access

## Approved direction

Build a focused Midnight dApp for the Rise In Level 3 submission. A guest proves possession of an authorized invitation without publishing their identity or invitation secret. The user approved Midnight and this product direction on 2026-09-24.

## Product scope

One deployment represents one event. An organizer creates an event allowlist and guests redeem invitations once. The app provides an event overview, guest access flow, organizer workspace and plain-language privacy explanation. Payments, cross-chain integrations, identity verification and multi-event contract orchestration are outside this submission.

Alternative ideas considered: an age gate requires a credible issuer to establish age; anonymous voting requires additional care around tally leakage. Private allowlist access provides a smaller, demonstrable privacy boundary and a foundation for a later access platform.

## Experience and visual direction

Use a charcoal canvas, warm white typography, restrained violet accents and an original geometric veil motif implemented as SVG/CSS. Create a polished application rather than a marketing-only landing page. The main screen prioritizes the event and the next action; a compact navigation opens access, organizer and privacy views. Support mobile, keyboard navigation, visible focus, reduced motion and readable contrast.

Wallet connection must identify compatible Midnight wallets and handle missing extension, locked wallet, user rejection, incompatible connector, wrong network, disconnect and timeout. Show actual connection and transaction state. A connected wallet does not itself establish allowlist membership.

Guest flow: connect wallet, import private invitation, review what will be disclosed, generate proof, approve transaction, wait for ledger confirmation and display a receipt. Never show success before confirmation. Recover gracefully from proof-service failure, stale state and an already redeemed invitation.

Organizer flow: connect, create a deployment, generate random invitation secrets, authorize commitments, export invitations explicitly and inspect redemption counts. Keep private invitation content out of URLs, analytics, logs and public deployment files.

## Contract and privacy boundary

Use Compact and compatible Midnight SDK versions selected and pinned together after checking official examples and compiling locally. Each contract instance has an immutable event identifier and organizer authority. Only an organizer-authorized circuit can register allowlist entries or close registration.

Each invitation contains a cryptographically random high-entropy secret. The contract stores commitments in a Merkle tree. Redemption proves knowledge of a secret whose commitment belongs to the current allowlist root, using a private Merkle witness. Public outputs include an event-scoped nullifier and redemption count. Enforce uniqueness of nullifiers in the contract, so the same invitation cannot be reused. Bind the nullifier to the event and secret with explicit domain separation.

The membership leaf, path and secret must remain private circuit inputs. Do not replace private membership with a public lookup of the leaf during redemption. Review compiled circuit disclosures against this requirement.

An observer can learn public event configuration, allowlist commitments/root, registration and redemption counts, transaction timing, and spent nullifiers. They must not learn the redeemed invitation secret or which commitment was used from the membership proof itself. Public timing, small anonymity sets and out-of-band information can still create correlations.

Invitations are bearer credentials: sharing a secret transfers the ability to redeem. The organizer may know whom they invited, and an organizer who generated secrets may correlate them with nullifiers. Do not claim anonymity from the organizer. A trusted proof service may receive private witness data; default to a local proof service and document this trust boundary. No claim of legal identity verification or a security audit.

## Application architecture

React, TypeScript and Vite frontend. Separate presentation, invitation validation, wallet connector, Midnight providers, contract integration and deployment configuration. Use the official connector types and SDK rather than handwritten approximations. Store only non-sensitive preferences by default; hold imported invitation secrets in memory and clear them on disconnect. Explicit downloads must warn that the invitation grants access.

Serve proving assets from the deployment and use an explicitly configured proof endpoint, indexer and network. Validate addresses and network configuration before enabling real actions. A missing contract or service must show setup status rather than silently simulating transactions. Any optional local demonstration must be clearly labeled and isolated from network receipts.

## Verification

Compile the real Compact contract. Test its generated runtime with valid membership, invalid secret/path, repeated redemption, unauthorized registration, closed registration and event separation. Add application tests for invitation parsing and wallet/error transitions. Add browser coverage for the core UI and accessibility basics; wallet mocks verify UI behavior only and are not evidence of on-chain execution.

CI on pushes and pull requests installs pinned dependencies, compiles Compact, type-checks, runs contract/application tests and builds the frontend. Browser smoke coverage runs against the production build. Publish only after successful checks. Record a real successful workflow run and actual on-chain redemption separately.

## Deliverables and evidence

- Public repository with setup, scripts, architecture, privacy model, network/deployment information and honest limitations.
- At least ten meaningful commits reflecting real milestones, without artificial history.
- Passing test evidence and screenshot, plus a CI workflow and verified passing run.
- Live frontend and deployed Midnight contract with real transaction evidence.
- Product proposal for Private Allowlist Access, prepared for organizer approval. Approval is external and must not be claimed without evidence.
- One-minute walkthrough showing wallet connection, invitation redemption, confirmed result and repeat-use rejection.

Suggested commit milestones: design; project foundation; Compact membership contract; contract tests; invitation handling; wallet/providers; guest UI; organizer UI; browser and accessibility verification; CI/deployment; submission documentation.

## Current environment and external dependencies

The project folder was initially empty and not a Git repository. Node 24 and npm are available. Docker was not found on PATH in the initial check; Compact compiler availability still needs a dedicated check. Compiler and proof infrastructure setup are implementation prerequisites, not reasons to substitute fake cryptography.

GitHub publication requires an authenticated account and a selected repository. A live proof server, a compatible funded test wallet and user-authorized wallet approvals may be required for actual deployment. Discover available access during implementation and request only missing inputs. Never request or collect a wallet seed phrase. Mark any incomplete submission evidence explicitly.

## Acceptance

All authorized local implementation and verification should be completed before publication-related missing inputs are requested. A passing build alone is not a completed Rise In submission: contract deployment, live demonstration, passing hosted CI, external proposal approval and the recorded demo each require their own evidence.
