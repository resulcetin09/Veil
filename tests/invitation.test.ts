import { describe, expect, it } from 'vitest';
import { parseDocument, validateEvent, newInvitation, type EventInfo } from '../src/lib/invitation';
import { fromHex, toHex } from '../src/lib/bytes';
import { safeError } from '../src/lib/errors';

const event: EventInfo = { version: 1, network: 'preview', contractAddress: '01'.repeat(32), eventId: '02'.repeat(32), name: 'Builders after dark' };
const doc = { ...event, kind: 'veil-invitation', secret: '03'.repeat(32) };
describe('Private invitation boundary', () => {
  it('validates and retains only supported fields', () => {
    expect(parseDocument(JSON.stringify({ ...doc, proverUrl: 'https://untrusted.invalid' }), 'veil-invitation')).toEqual(doc);
  });
  it('rejects organizer secrets in the guest flow', () => {
    expect(() => parseDocument(JSON.stringify({ ...doc, kind: 'veil-organizer' }), 'veil-invitation')).toThrow('guest invitation');
  });
  it.each([{ network: 'mainnet' }, { secret: 'bad' }, { eventId: '' }, { version: 2 }, { name: '' }])('rejects malformed or mismatched inputs %j', (change) => {
    expect(() => parseDocument(JSON.stringify({ ...doc, ...change }), 'veil-invitation')).toThrow();
  });
  it('rejects invalid and oversized documents', () => {
    expect(() => parseDocument('{', 'veil-invitation')).toThrow();
    expect(() => parseDocument('x'.repeat(16385), 'veil-invitation')).toThrow('too large');
  });
  it('binds invitations to the event read from the ledger', () => {
    expect(() => validateEvent(event, fromHex('04'.repeat(32)))).toThrow('does not match');
    expect(() => validateEvent(event, fromHex(event.eventId))).not.toThrow();
  });
  it('generates independent 256-bit invitation secrets', () => {
    const first = newInvitation(event), second = newInvitation(event);
    expect(fromHex(first.secret, 32)).toHaveLength(32);
    expect(first.secret).not.toBe(second.secret);
  });
  it('round-trips bytes and rejects partial hexadecimal input', () => {
    expect(toHex(fromHex('00aaff'))).toBe('00aaff');
    expect(() => fromHex('abc')).toThrow();
    expect(() => fromHex('xx')).toThrow();
  });
  it('does not reflect witness secrets from raw SDK errors', () => {
    const secret = 'sensitive-witness-material';
    expect(safeError(new Error(`proof failure ${secret}`))).not.toContain(secret);
  });
});
