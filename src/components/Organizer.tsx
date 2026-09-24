import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowClockwise,
  DownloadSimple,
  FileArrowUp,
  Key,
  LockKey,
  Plus,
  Users,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button, Modal, Surface } from "./Primitives";
import { randomSecret, shortId, toHex } from "../lib/bytes";
import {
  downloadJson,
  newInvitation,
  parseDocument,
  readPrivateFile,
  type Invitation,
  type OrganizerFile,
} from "../lib/invitation";
import { safeError } from "../lib/errors";
import type { EventState, MidnightClient, Phase } from "../lib/midnight";
import type { WalletSession } from "../lib/wallet";

export function Organizer({
  wallet,
  connect,
  getClient,
  phase,
  setBusy: globalBusy,
}: {
  wallet: WalletSession | null;
  connect: () => void;
  getClient: () => Promise<MidnightClient>;
  phase: Phase;
  setBusy: (busy: boolean) => boolean;
}) {
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState<OrganizerFile | null>(null);
  const [event, setEvent] = useState<EventState | null>(null);
  const [pending, setPending] = useState<Invitation | null>(null);
  const [registered, setRegistered] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteSaved, setInviteSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const draft = useRef<{ secret: Uint8Array; eventId: Uint8Array } | null>(
    null,
  );
  useEffect(() => {
    if ((!organizer || saved) && (!pending || inviteSaved) && !busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [organizer, saved, pending, inviteSaved, busy]);
  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    if (!wallet) {
      connect();
      return;
    }
    if (!globalBusy(true)) {
      setError(
        "Another operation is in progress. Wait for it to finish before continuing.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (err) {
      setError(safeError(err));
    } finally {
      lock.current = false;
      setBusy(false);
      globalBusy(false);
    }
  }
  async function deploy() {
    if (!name.trim() || name.trim().length > 100) {
      setError("Enter an event name between 1 and 100 characters.");
      document.getElementById("event-name")?.focus();
      return;
    }
    await run(async () => {
      draft.current ??= { secret: randomSecret(), eventId: randomSecret() };
      const client = await getClient();
      const result = await client.deploy(
        name.trim(),
        draft.current.secret,
        draft.current.eventId,
      );
      const recovery: OrganizerFile = {
        ...result.event,
        kind: "veil-organizer",
        secret: toHex(draft.current.secret),
      };
      setOrganizer(recovery);
      setEvent({ count: 0, admitted: 0, open: true, root: "" });
      setSaved(false);
      draft.current = null;
      setMessage(
        "Your event is confirmed on Midnight. Save your recovery file before issuing invitations.",
      );
    });
  }
  async function load(file: File) {
    try {
      const recovery = parseDocument(
        await readPrivateFile(file),
        "veil-organizer",
      );
      setOrganizer(recovery);
      setEvent(null);
      setSaved(true);
      setPending(null);
      setError("");
      if (wallet)
        await run(async () => {
          setEvent(await (await getClient()).inspect(recovery));
        });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The recovery file could not be read.",
      );
    }
  }
  async function refresh() {
    if (organizer)
      await run(async () =>
        setEvent(await (await getClient()).inspect(organizer)),
      );
  }
  async function issue() {
    if (!organizer) return;
    await run(async () => {
      const invitation =
        pending && !registered ? pending : newInvitation(organizer);
      setPending(invitation);
      setRegistered(false);
      setInviteSaved(false);
      const client = await getClient();
      await client.register(organizer, invitation);
      setRegistered(true);
      setMessage(
        "Invitation registered on Midnight. Download it and share it privately with its guest.",
      );
      // Confirmation is already known even if a later read fails.
      setEvent((previous) =>
        previous ? { ...previous, count: previous.count + 1 } : previous,
      );
    });
  }
  async function close() {
    setConfirmClose(false);
    if (!organizer) return;
    await run(async () => {
      await (await getClient()).close(organizer);
      setEvent((previous) =>
        previous ? { ...previous, open: false } : previous,
      );
      setMessage(
        "The allowlist is sealed. Guests can now redeem their invitations.",
      );
    });
  }
  return (
    <section className="organizer-view reveal">
      <div className="section-intro">
        <span className="eyebrow">For the people bringing people together</span>
        <h1>
          Good company.
          <br />
          Private access.
        </h1>
        <p>
          Create a gathering, invite your guests and let Midnight verify their
          place. No public guest names required.
        </p>
      </div>
      <div className="organizer-grid">
        <Surface className="organizer-main">
          <div className="panel-topline">
            <span className="panel-label">
              {organizer ? "Your event" : "Create a gathering"}
            </span>
            <span className="status-pill">
              <i />
              Midnight Preview
            </span>
          </div>
          {!organizer ? (
            <>
              <div className="organizer-symbol">
                <Users size={32} weight="light" aria-hidden="true" />
              </div>
              <h2>Make room for your people.</h2>
              <p className="muted">
                Each event has its own contract and a private invitation for
                every guest.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void deploy();
                }}
              >
                <label className="field-label" htmlFor="event-name">
                  Event name
                </label>
                <div className="input-shell">
                  <input
                    id="event-name"
                    name="event-name"
                    autoComplete="off"
                    placeholder="e.g. Builders after dark…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    disabled={busy}
                  />
                </div>
                <p className="field-help">
                  A display name for invitation files. Guests verify the event
                  ID against the ledger.
                </p>
                <Button type="submit" arrow disabled={busy}>
                  {busy
                    ? "Creating your event…"
                    : wallet
                      ? "Create event on Midnight"
                      : "Connect wallet to begin"}
                </Button>
              </form>
              <div className="or-divider">
                <span />
                Already hosting?
                <span />
              </div>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <FileArrowUp size={18} weight="light" aria-hidden="true" />
                Import recovery file
              </Button>
            </>
          ) : (
            <>
              <h2 className="event-title">{organizer.name}</h2>
              <p className="contract-address">
                Contract <code>{shortId(organizer.contractAddress)}</code>
              </p>
              <div className="event-counters">
                <div>
                  <strong>
                    {event ? new Intl.NumberFormat().format(event.count) : "—"}
                  </strong>
                  <span>Invitations</span>
                </div>
                <div>
                  <strong>
                    {event
                      ? new Intl.NumberFormat().format(event.admitted)
                      : "—"}
                  </strong>
                  <span>Admitted</span>
                </div>
                <span className={`state-chip ${event?.open ? "" : "sealed"}`}>
                  <LockKey size={14} weight="light" />
                  {event
                    ? event.open
                      ? "Registration open"
                      : "Allowlist sealed"
                    : "Not checked"}
                </span>
              </div>
              <div className={`recovery-callout ${saved ? "saved" : ""}`}>
                <Key size={23} weight="light" />
                <div>
                  <strong>
                    {saved ? "Recovery file ready" : "Save your organizer key"}
                  </strong>
                  <p>
                    {saved
                      ? "Keep the file private. It grants control of this event."
                      : "This secret exists only in this tab. Download it before continuing."}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  downloadJson(organizer, "veil-event.organizer.json");
                  setSaved(true);
                }}
              >
                <DownloadSimple size={18} weight="light" />
                Download recovery file
              </Button>
              {event?.open && (
                <div className="issue-section">
                  <h3>Give someone a place.</h3>
                  <p className="muted">
                    Register a fresh invitation, then send the downloaded file
                    privately. Capacity: 1,024 invitations.
                  </p>
                  <Button
                    arrow
                    disabled={
                      busy ||
                      !saved ||
                      (registered && !inviteSaved) ||
                      event.count >= 1024
                    }
                    onClick={() => void issue()}
                  >
                    <Plus size={18} weight="light" />
                    {pending && !registered
                      ? "Retry invitation registration"
                      : "Create private invitation"}
                  </Button>
                </div>
              )}
              {pending && (
                <div className="issued-invitation">
                  <div className="inline-label">
                    {registered ? (
                      <CheckCircle size={19} weight="light" />
                    ) : (
                      <WarningCircle size={19} weight="light" />
                    )}
                    <strong>
                      {registered
                        ? "Invitation confirmed"
                        : "Invitation pending confirmation"}
                    </strong>
                  </div>
                  <p>
                    {registered
                      ? "Anyone with this file can claim the invitation. Share it only with the intended guest."
                      : "Keep this draft so its secret is not lost. Do not distribute it until registration is confirmed."}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      downloadJson(pending, "veil-guest.invitation.json");
                      setInviteSaved(true);
                    }}
                  >
                    <DownloadSimple size={18} weight="light" />
                    {registered
                      ? "Download invitation"
                      : "Save pending invitation"}
                  </Button>
                </div>
              )}
              <div className="organizer-actions">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void refresh()}
                >
                  <ArrowClockwise size={16} weight="light" />
                  Refresh event
                </button>
                {event?.open && (
                  <button
                    className="text-button"
                    disabled={
                      busy || !saved || (pending !== null && !inviteSaved)
                    }
                    onClick={() => setConfirmClose(true)}
                  >
                    <LockKey size={16} weight="light" />
                    Seal allowlist
                  </button>
                )}
              </div>
              {event && !event.open && (
                <p className="muted">
                  Registration is permanently closed. Guests can now prove their
                  membership and redeem once.
                </p>
              )}
            </>
          )}
          <input
            ref={input}
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            aria-label="Import organizer recovery file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void load(file);
              e.target.value = "";
            }}
          />
          {busy && (
            <p className="operation-status" role="status">
              {phase === "proving"
                ? "Generating a private proof…"
                : phase === "approving"
                  ? "Approve the transaction in your wallet…"
                  : phase === "confirming"
                    ? "Waiting for network confirmation…"
                    : "Preparing the event transaction…"}{" "}
              Keep this tab open.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
        </Surface>
        <aside className="organizer-guide">
          <span className="eyebrow">A thoughtful guest list</span>
          <h2>
            The gathering is yours.
            <br />
            The proof is theirs.
          </h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>Create your event</h3>
                <p>
                  Deploy a dedicated contract and save your organizer recovery
                  file.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Invite with care</h3>
                <p>
                  Download each private invitation and send it directly to its
                  guest.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Seal the list</h3>
                <p>
                  Freeze membership so everyone proves against the same final
                  guest list.
                </p>
              </div>
            </li>
          </ol>
          <div className="organizer-trust">
            <LockKey size={22} weight="light" />
            <p>
              Creating invitations means you know their secrets. Be clear with
              guests: this protects them from public observers, not from you.
            </p>
          </div>
          <a className="text-link" href="#privacy">
            Read the privacy boundaries{" "}
            <ArrowUpRight size={17} weight="light" />
          </a>
        </aside>
      </div>
      {confirmClose && (
        <Modal
          title="Seal this guest list?"
          onClose={() => setConfirmClose(false)}
        >
          <p className="muted">
            This permanently closes registration for{" "}
            <strong>{organizer?.name}</strong>. You will not be able to add more
            invitations. Existing guests will be able to redeem their access.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmClose(false)}>
              Keep registration open
            </Button>
            <Button onClick={() => void close()}>Seal allowlist</Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
