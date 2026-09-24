import { fromHex, randomSecret, toHex } from "./bytes";

export const NETWORK = "preview";
export interface EventInfo {
  version: 1;
  network: typeof NETWORK;
  contractAddress: string;
  eventId: string;
  name: string;
}
export interface Invitation extends EventInfo {
  kind: "veil-invitation";
  secret: string;
}
export interface OrganizerFile extends EventInfo {
  kind: "veil-organizer";
  secret: string;
}

export function parseDocument(
  text: string,
  kind: "veil-invitation",
): Invitation;
export function parseDocument(
  text: string,
  kind: "veil-organizer",
): OrganizerFile;
export function parseDocument(
  text: string,
  kind: "veil-invitation" | "veil-organizer",
): Invitation | OrganizerFile {
  if (text.length > 16384)
    throw new Error(
      "This file is too large. Select a Veil invitation or recovery file under 16 KB.",
    );
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(
      "This is not a valid Veil JSON file. Use the original download.",
    );
  }
  if (!value || typeof value !== "object")
    throw new Error("Invalid Veil file. Use the original download.");
  const doc = value as Record<string, unknown>;
  if (doc.version !== 1 || doc.kind !== kind)
    throw new Error(
      kind === "veil-invitation"
        ? "Select a guest invitation, not an organizer recovery file."
        : "Select your organizer recovery file.",
    );
  if (doc.network !== NETWORK)
    throw new Error(
      "This invitation belongs to another network. Veil currently uses Midnight Preview.",
    );
  for (const key of ["contractAddress", "eventId", "secret"]) {
    if (
      typeof doc[key] !== "string" ||
      !/^[a-f0-9]{64}$/i.test(doc[key] as string)
    )
      throw new Error(
        `The ${key === "secret" ? "private invitation" : "event"} data is incomplete. Ask for a new file.`,
      );
  }
  if (typeof doc.name !== "string" || !doc.name.trim() || doc.name.length > 100)
    throw new Error("Invalid event name. Ask for a new file.");
  // Whitelist fields: never retain arbitrary input properties or endpoint overrides.
  return {
    version: 1,
    kind,
    network: NETWORK,
    contractAddress: (doc.contractAddress as string).toLowerCase(),
    eventId: (doc.eventId as string).toLowerCase(),
    secret: (doc.secret as string).toLowerCase(),
    name: doc.name.trim(),
  };
}

export function newInvitation(event: EventInfo): Invitation {
  return { ...event, kind: "veil-invitation", secret: toHex(randomSecret()) };
}

export function validateEvent(info: EventInfo, eventId: Uint8Array) {
  fromHex(info.contractAddress, 32);
  if (toHex(eventId) !== info.eventId)
    throw new Error(
      "The invitation does not match this deployed event. Ask the organizer for a new invitation.",
    );
}

export async function readPrivateFile(file: File): Promise<string> {
  if (file.size > 16384)
    throw new Error("Select a Veil JSON file smaller than 16 KB.");
  return file.text();
}

export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
