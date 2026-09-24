# Rise In submission evidence

This file tracks observed evidence, not aspirations. Update each external item only after verification.

| Requirement                  | Current evidence                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Chosen idea                  | Private Allowlist Access — [proposal](product-proposal.md)                                                                                |
| External idea approval       | Not yet submitted/verified                                                                                                                |
| Compact contract             | `contracts/veil.compact`, compiler 0.31.1; all 3 circuits compile and proving keys generated locally                                      |
| 3+ passing tests             | 35 local contract/application tests, 22 production browser checks and 10 development-server checks passed                                 |
| Public repository            | Public repository exists at `https://github.com/resulcetin09/Veil`                                                                        |
| 10+ meaningful commits       | 18 meaningful commits; verify with `git log --oneline`                                                                                    |
| CI/CD                        | Hosted GitHub Actions workflow passes: `Compile, test & build`                                                                            |
| Live frontend                | Live demo verified with HTTP 200 at `https://veil-virid.vercel.app`                                                                       |
| Network contract and receipt | Not yet deployed/verified with a real funded Preview wallet                                                                               |
| Test screenshot              | [Actual passing test output](evidence/test-output.png), [raw output](evidence/test-output.txt)                                            |
| One-minute video             | [Google Drive recording](https://drive.google.com/file/d/1jNed-qsQ07_LfavvXqrJNn5NfCJ8htPK/view?usp=sharing), verified with HTTP 200      |
| Privacy model                | README and in-app Privacy view, including organizer/prover/metadata boundaries                                                            |

The local demo is a real execution of the generated contract runtime, not a cryptographic proof or a network transaction. It must not be used as substitute evidence for the live network requirement.

Latest local validation: production build and 35 unit/contract tests passed. All 22 production browser checks and 10 development-server checks passed with one worker; two optional production evidence-capture entries were intentionally skipped. Earlier concurrent Chrome launches intermittently timed out before test context creation.

The reported local-demo failure was reproduced on port 5173: Vite could not resolve the nested on-chain runtime after dependency optimization. A direct pinned runtime dependency fixes resolution; a browser process shim also fixes SDK initialization in development. The demo was manually completed at the user-facing address after these fixes. CI now checks development-server behavior as well as production.

Wallet connection errors now distinguish permission, network, lock and extension failures, including structured connector errors. Mocked Preview connection succeeds without a proof server. Real Lace connection remains blocked by the local wallet/network/funding setup, not by the application build.
