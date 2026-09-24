# Rise In submission evidence

This file tracks observed evidence, not aspirations. Update each external item only after verification.

| Requirement                  | Current evidence                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Chosen idea                  | Private Allowlist Access — [proposal](product-proposal.md)                                                                                |
| External idea approval       | Not yet submitted/verified                                                                                                                |
| Compact contract             | `contracts/veil.compact`, compiler 0.31.1; all 3 circuits compile and proving keys generated locally                                      |
| 3+ passing tests             | 27 local contract/application tests, 18 production browser checks and 6 development-server checks passed                                  |
| Public repository            | Public repository exists at `https://github.com/resulcetin09/Veil`; push rejected because the current GitHub token lacks `workflow` scope |
| 10+ meaningful commits       | 14 meaningful local commits; verify with `git log --oneline`                                                                              |
| CI/CD                        | `.github/workflows/ci.yml` implemented; hosted run blocked until the workflow can be pushed                                               |
| Live frontend                | GitHub Pages target `https://resulcetin09.github.io/Veil/`; publication verification pending                                              |
| Network contract and receipt | Not yet deployed/verified with a real funded Preview wallet                                                                               |
| Test screenshot              | [Actual passing test output](evidence/test-output.png), [raw output](evidence/test-output.txt)                                            |
| One-minute video             | [Script prepared](demo-script.md); real-network recording pending                                                                         |
| Privacy model                | README and in-app Privacy view, including organizer/prover/metadata boundaries                                                            |

The local demo is a real execution of the generated contract runtime, not a cryptographic proof or a network transaction. It must not be used as substitute evidence for the live network requirement.

Latest local validation: production build and 27 unit/contract tests passed. All 18 production browser checks and 6 development-server checks passed with one worker; two optional production evidence-capture entries were intentionally skipped. Earlier concurrent Chrome launches intermittently timed out before test context creation.

The reported local-demo failure was reproduced on port 5173: Vite could not resolve the nested on-chain runtime after dependency optimization. A direct pinned runtime dependency fixes resolution; a browser process shim also fixes SDK initialization in development. The demo was manually completed at the user-facing address after these fixes. CI now checks development-server behavior as well as production. This does not imply a hosted CI run or network deployment.
