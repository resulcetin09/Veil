import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { Transaction } from "@midnight-ntwrk/ledger-v8";
import {
  MidnightBech32m,
  ShieldedAddress,
} from "@midnight-ntwrk/wallet-sdk-address-format";
import type {
  MidnightProviders,
  FinalizedTxData,
} from "@midnight-ntwrk/midnight-js-types";
import {
  Contract,
  ledger,
  pureCircuits,
} from "../../contracts/managed/veil/contract/index.js";
import { witnesses, type PrivateState } from "../contract/witnesses";
import { memoryPrivateState } from "./private-state";
import { assertWalletNetwork, type WalletSession } from "./wallet";
import {
  NETWORK,
  validateEvent,
  type EventInfo,
  type Invitation,
  type OrganizerFile,
} from "./invitation";
import { fromHex, randomSecret, toHex } from "./bytes";
import { UserError, withTimeout } from "./errors";

export type Phase = "preparing" | "proving" | "approving" | "confirming";
export interface Receipt {
  txId: string;
  block: number;
  nullifier?: string;
  mode: "network" | "demo";
}
export interface EventState {
  count: number;
  admitted: number;
  open: boolean;
  root: string;
}
type Circuits = "register" | "closeRegistration" | "redeem";
type Providers = MidnightProviders<Circuits, string, PrivateState>;

const compiledContract = CompiledContract.make(
  "Veil",
  Contract<PrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets("contract/veil"),
);

function receipt(data: FinalizedTxData): Receipt {
  if (data.status !== "SucceedEntirely")
    throw new UserError(
      "The transaction was included but did not complete successfully. Refresh the event before retrying.",
    );
  return { mode: "network", txId: data.txId, block: data.blockHeight };
}

export function localProver(url: string | undefined): string {
  if (!url)
    throw new UserError(
      "Choose a local proof server in your wallet settings (http://localhost:6300), then reconnect.",
    );
  const parsed = new URL(url);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) ||
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  ) {
    throw new UserError(
      "Veil requires a local proof server so invitation witnesses are not sent to a third party. Set your wallet proof server to http://localhost:6300.",
    );
  }
  return parsed.href;
}

export async function createMidnightClient(
  session: WalletSession,
  onPhase: (phase: Phase) => void,
) {
  setNetworkId(NETWORK);
  const config = await assertWalletNetwork(session.api);
  const prover = localProver(config.proverServerUri);
  const { shieldedAddress } = await session.api.getShieldedAddresses();
  const keys = MidnightBech32m.parse(shieldedAddress).decode(
    ShieldedAddress,
    NETWORK,
  );
  const privateStateProvider = memoryPrivateState();
  const zkConfigProvider = new FetchZkConfigProvider<Circuits>(
    new URL(
      `${import.meta.env.BASE_URL}contract/veil`,
      window.location.origin,
    ).href,
  );
  const rawProof = httpClientProofProvider(prover, zkConfigProvider);
  const rawPublic = indexerPublicDataProvider(
    config.indexerUri,
    config.indexerWsUri,
  );
  const providers: Providers = {
    privateStateProvider,
    zkConfigProvider,
    publicDataProvider: {
      ...rawPublic,
      async queryZSwapAndContractState(address, options) {
        const result = await rawPublic.queryZSwapAndContractState(
          address,
          options,
        );
        if (!result) return result;
        const [zswap, contract, parameters] = result;
        return [zswap.postBlockUpdate(new Date()), contract, parameters];
      },
    },
    proofProvider: {
      async proveTx(tx, options) {
        await assertWalletNetwork(session.api);
        onPhase("proving");
        return rawProof.proveTx(tx, options);
      },
    },
    walletProvider: {
      getCoinPublicKey: () => keys.coinPublicKeyString(),
      getEncryptionPublicKey: () => keys.encryptionPublicKeyString(),
      async balanceTx(tx) {
        await assertWalletNetwork(session.api);
        onPhase("approving");
        const result = await session.api.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return Transaction.deserialize(
          "signature",
          "proof",
          "binding",
          fromHex(result.tx),
        );
      },
    },
    midnightProvider: {
      async submitTx(tx) {
        await assertWalletNetwork(session.api);
        await session.api.submitTransaction(toHex(tx.serialize()));
        onPhase("confirming");
        return tx.identifiers()[0];
      },
    },
  };
  async function state(info: EventInfo) {
    const result = await withTimeout(
      rawPublic.queryContractState(info.contractAddress),
      30000,
      "The event could not be loaded from the indexer. Check your connection and try again.",
    );
    if (!result)
      throw new UserError(
        "This event was not found on Preview. Check the invitation with its organizer.",
      );
    const value = ledger(result.data);
    try {
      validateEvent(info, value.eventId);
    } catch {
      throw new UserError(
        "This file does not match the deployed event. Ask the organizer for a new invitation.",
      );
    }
    return value;
  }
  async function join(info: EventInfo, privateState: PrivateState) {
    onPhase("preparing");
    await assertWalletNetwork(session.api);
    await state(info);
    return findDeployedContract(providers, {
      compiledContract,
      contractAddress: info.contractAddress,
      privateStateId: "veil",
      initialPrivateState: privateState,
    });
  }
  async function withPrivateState<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } finally {
      // Witness state is re-imported for each operation, never retained by the SDK.
      await privateStateProvider.clear();
    }
  }
  return {
    async inspect(info: EventInfo): Promise<EventState> {
      const value = await state(info);
      return {
        count: Number(value.registered.size()),
        admitted: Number(value.admitted),
        open: value.registrationOpen,
        root: value.invitations.root().field.toString(16),
      };
    },
    async deploy(
      name: string,
      secret: Uint8Array,
      eventId: Uint8Array,
    ): Promise<{ event: EventInfo; receipt: Receipt }> {
      return withPrivateState(async () => {
        onPhase("preparing");
        const contract = await deployContract(providers, {
          compiledContract,
          privateStateId: "veil",
          initialPrivateState: { organizerSecret: secret },
          args: [eventId, pureCircuits.organizerCommitment(secret)],
        });
        const confirmed = receipt(contract.deployTxData.public);
        return {
          event: {
            version: 1,
            network: NETWORK,
            contractAddress: contract.deployTxData.public.contractAddress,
            eventId: toHex(eventId),
            name,
          },
          receipt: confirmed,
        };
      });
    },
    async register(
      info: OrganizerFile,
      invitation: Invitation,
    ): Promise<Receipt> {
      return withPrivateState(async () => {
        const contract = await join(info, {
          organizerSecret: fromHex(info.secret, 32),
        });
        const tx = await contract.callTx.register(
          pureCircuits.invitationCommitment(
            fromHex(info.eventId, 32),
            fromHex(invitation.secret, 32),
          ),
        );
        return receipt(tx.public);
      });
    },
    async close(info: OrganizerFile): Promise<Receipt> {
      return withPrivateState(async () => {
        const contract = await join(info, {
          organizerSecret: fromHex(info.secret, 32),
        });
        return receipt((await contract.callTx.closeRegistration()).public);
      });
    },
    async redeem(info: Invitation): Promise<Receipt> {
      return withPrivateState(async () => {
        const secret = fromHex(info.secret, 32);
        const contract = await join(info, { invitationSecret: secret });
        const tx = await contract.callTx.redeem();
        const confirmed = receipt(tx.public);
        return {
          ...confirmed,
          nullifier: toHex(
            pureCircuits.invitationNullifier(fromHex(info.eventId, 32), secret),
          ),
        };
      });
    },
    async clear() {
      await privateStateProvider.clear();
      await privateStateProvider.clearSigningKeys();
    },
  };
}

export type MidnightClient = Awaited<ReturnType<typeof createMidnightClient>>;
export const generateOrganizer = () => ({
  secret: randomSecret(),
  eventId: randomSecret(),
});
