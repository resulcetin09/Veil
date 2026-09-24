import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CheckCircle, Copy, DownloadSimple, FileArrowUp, Fingerprint, LockKey, ShieldCheck, Sparkle, Wallet, X, EyeSlash, Info, ArrowClockwise } from '@phosphor-icons/react';
import { Button, Mark, Surface } from './Primitives';
import type { WalletSession } from '../lib/wallet';
import type { EventState, MidnightClient, Phase, Receipt } from '../lib/midnight';
import { downloadJson, parseDocument, readPrivateFile, type Invitation } from '../lib/invitation';
import { safeError } from '../lib/errors';
import { shortId } from '../lib/bytes';
import type { Demo } from '../lib/demo';

interface Props { wallet: WalletSession | null; connect: () => void; getClient: () => Promise<MidnightClient>; phase: Phase; setBusy: (busy: boolean) => void }
const steps: [Phase, string][] = [['preparing', 'Check membership'], ['proving', 'Generate private proof'], ['approving', 'Approve in your wallet'], ['confirming', 'Wait for network confirmation']];

export function Access({ wallet, connect, getClient, phase, setBusy: globalBusy }: Props) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [demo, setDemo] = useState<Demo | null>(null);
  const [event, setEvent] = useState<EventState | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disclosure, setDisclosure] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const actionLock = useRef(false);
  useEffect(() => {
    if (!invitation || demo) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [invitation, demo]);
  async function run(action: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); globalBusy(true); setError('');
    try { await action(); } catch (err) { setError(safeError(err)); }
    finally { actionLock.current = false; setBusy(false); globalBusy(false); }
  }
  async function startDemo() {
    await run(async () => {
      const { createDemo } = await import('../lib/demo');
      const next = createDemo(); setDemo(next); setInvitation(next.invitation); setEvent(next.inspect()); setReceipt(null); setDisclosure(false);
    });
  }
  async function importFile(file: File) {
    try { const value = parseDocument(await readPrivateFile(file), 'veil-invitation'); setInvitation(value); setEvent(null); setReceipt(null); setDemo(null); setDisclosure(false); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'The file could not be read. Try the original invitation.'); }
  }
  async function redeem() {
    if (!invitation) { input.current?.click(); return; }
    if (!demo && !wallet) { connect(); return; }
    if (!disclosure) { setError('Review the disclosure note and check the box before continuing.'); document.getElementById('disclosure')?.focus(); return; }
    await run(async () => {
      if (demo) { setReceipt(demo.redeem()); setEvent(demo.inspect()); }
      else { const client = await getClient(); setEvent(await client.inspect(invitation)); const confirmed = await client.redeem(invitation); setReceipt(confirmed); }
    });
  }
  async function copy() {
    if (!receipt) return;
    try { await navigator.clipboard.writeText(receipt.txId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError('Clipboard access is unavailable. Download your receipt instead.'); }
  }
  function reset() { setDemo(null); setInvitation(null); setEvent(null); setReceipt(null); setError(''); setDisclosure(false); }
  return <section className="access-view reveal">
    <div className="hero-grid"><div className="hero-story">
      <div className="eyebrow"><span className="tiny-aperture" />Private access on Midnight</div>
      <h1>Access, without<br />exposure.</h1>
      <p className="hero-description">A little less disclosure.<br />A lot more possibility.</p>
      <p className="hero-body">Prove you’re on the guest list without revealing your invitation. Your place is verified. Your secret stays yours.</p>
      <a className="text-link" href="#privacy">Discover what stays private <ArrowUpRight size={17} weight="light" aria-hidden="true" /></a>
      <div className="event-art"><div className="portal-art" aria-hidden="true"><div className="portal-light" /><div className="portal-left" /><div className="portal-right" /></div><div className="event-art-top"><span><i className="mini-dot" />{demo ? 'Local demo event' : invitation ? 'Your invited event' : 'An invitation to something different'}</span><Mark size={26} /></div><div className="event-art-bottom"><div><span className="art-label">{invitation ? 'Private gathering' : 'Experience Veil'}</span><h2>{invitation?.name ?? 'Builders after dark'}</h2><p>{demo ? '4 sample invitations · Runs only in your browser' : invitation ? 'Invitation-only access · Midnight Preview' : 'Explore a private gathering in our local demo'}</p></div>{!demo && !invitation && <button className="art-arrow" aria-label="Explore local demo event" onClick={() => void startDemo()} disabled={busy}><ArrowUpRight size={23} weight="light" /></button>}</div></div>
    </div>
    <Surface className="access-panel"><div className="panel-topline"><span className="panel-label">Your access</span><span className={`status-pill ${demo ? 'demo' : ''}`}><i />{demo ? 'Local demo' : wallet ? 'Wallet connected' : 'Not connected'}</span></div>
      {receipt ? <div className="receipt-content"><div className="success-orbit"><CheckCircle size={46} weight="light" /></div><span className="eyebrow">{demo ? 'Local circuit passed' : 'Confirmed on Midnight'}</span><h2>You’re on the list.</h2><p>{demo ? 'The compiled contract accepted your sample invitation. No transaction or zero-knowledge proof was generated.' : 'Your invitation was verified and consumed. Your secret was not published in the membership proof.'}</p><div className="receipt-details"><div><span>Event</span><strong>{invitation?.name}</strong></div><div><span>Verification</span><strong>{demo ? 'Local execution' : `Block ${new Intl.NumberFormat().format(receipt.block)}`}</strong></div><div><span>One-time ID</span><code>{shortId(receipt.nullifier ?? '')}</code></div></div><Button arrow onClick={() => downloadJson({ ...receipt, event: invitation?.name, contractAddress: invitation?.contractAddress, network: demo ? 'none — local demonstration' : 'preview' }, 'veil-access-receipt.json')}><DownloadSimple size={18} weight="light" aria-hidden="true" />Download receipt</Button>{!demo && <button className="text-button" onClick={() => void copy()}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Transaction ID copied' : 'Copy transaction ID'}</button>}<Button variant="quiet" disabled={busy} onClick={() => void redeem()}><ArrowClockwise size={16} weight="light" aria-hidden="true" />Test one-time protection</Button><button className="text-button" onClick={reset}>Clear invitation & start again</button></div> : <>
        <div className="access-symbol"><Fingerprint size={44} weight="light" aria-hidden="true" /><span className="symbol-corner"><LockKey size={14} weight="light" aria-hidden="true" /></span></div>
        <h2>A private way in.</h2><p className="panel-description">Bring your invitation.<br />Leave your identity at the door.</p>
        <ol className="access-steps"><li className={wallet || demo ? 'complete' : 'current'}><span className="step-dot">{wallet || demo ? <Check size={13} /> : '1'}</span><div><strong>{demo ? 'Local session ready' : 'Connect your wallet'}</strong><small>{demo ? 'No wallet or funds needed' : wallet ? `${wallet.name} · Midnight Preview` : 'Your keys. Your control.'}</small></div><Wallet size={19} weight="light" aria-hidden="true" /></li><li className={invitation ? 'complete' : wallet || demo ? 'current' : ''}><span className="step-dot">{invitation ? <Check size={13} /> : '2'}</span><div><strong>{invitation ? 'Invitation ready' : 'Add your invitation'}</strong><small>{invitation ? invitation.name : 'A secret shared just with you'}</small></div><FileArrowUp size={19} weight="light" aria-hidden="true" /></li><li className={invitation ? 'current' : ''}><span className="step-dot">3</span><div><strong>{demo ? 'Run the access check' : 'Prove your access'}</strong><small>{demo ? 'Real circuit logic, local execution' : 'Reveal membership. Nothing more.'}</small></div><ShieldCheck size={19} weight="light" aria-hidden="true" /></li></ol>
        <input ref={input} type="file" accept=".json,application/json" aria-label="Import private invitation" className="visually-hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = ''; }} />
        {invitation && <><div className="invitation-loaded"><LockKey size={17} weight="light" /><span>Private invitation loaded</span><button className="icon-button" disabled={busy} aria-label="Remove invitation" onClick={reset}><X size={16} /></button></div><label className="disclosure-check"><input id="disclosure" type="checkbox" checked={disclosure} onChange={(e) => setDisclosure(e.target.checked)} disabled={busy} /><span>{demo ? 'I understand this is a local demonstration, with no network transaction.' : 'I understand the event, admission count and one-time identifier are public. My local proof server processes the private witness.'}</span></label></>}
        {busy && !demo && <div className="transaction-progress" role="status"><strong>{steps.find(([value]) => value === phase)?.[1]}…</strong><div className="progress-track">{steps.map(([value, label], index) => <span key={value} className={index <= steps.findIndex(([current]) => current === phase) ? 'active' : ''} title={label} />)}</div><small>Keep this tab open. Only network confirmation grants access.</small></div>}
        <Button arrow disabled={busy} onClick={() => { if (!wallet && !demo) connect(); else void redeem(); }}>{busy ? 'Processing…' : !wallet && !demo ? 'Connect wallet' : !invitation ? 'Import invitation' : demo ? 'Verify demo access' : 'Prove & request access'}</Button>
        {!invitation && <button className="text-button demo-link" disabled={busy} onClick={() => void startDemo()}><Sparkle size={15} weight="light" aria-hidden="true" />Just exploring? Try the local demo</button>}
        {invitation && <button className="text-button" disabled={busy} onClick={reset}>{demo ? 'Exit demo' : 'Clear private invitation'}</button>}
        <div className="panel-footnote"><LockKey size={13} weight="light" aria-hidden="true" /><span>{demo ? 'Local only. No proof or network transaction.' : 'Your invitation secret stays out of the public proof.'}</span></div>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </Surface></div>
    {demo && <div className="demo-notice" role="status"><Info size={20} weight="light" aria-hidden="true" /><p><strong>You’re in the local demo.</strong> The actual compiled Compact contract runs in your browser. This does not establish live network access.</p><button className="text-button" disabled={busy} onClick={reset}>Exit demo</button></div>}
    <div className="privacy-ribbon"><div className="ribbon-lead"><EyeSlash size={26} weight="light" aria-hidden="true" /><span>Privacy is the<br /><strong>entry requirement.</strong></span></div><div><span className="ribbon-number">01</span><p><strong>Prove, don’t reveal.</strong><span>Your invitation never appears in the public proof.</span></p></div><div><span className="ribbon-number">02</span><p><strong>One invitation. One entry.</strong><span>Replay protection is enforced by the contract.</span></p></div><a href="#privacy" className="ribbon-link" aria-label="Read the full privacy model"><ArrowUpRight size={24} weight="light" /></a></div>
    {event && <p className="event-summary">{demo ? 'Local example state' : 'Last checked event state'}: {new Intl.NumberFormat().format(event.count)} invitations · {new Intl.NumberFormat().format(event.admitted)} admitted · {event.open ? 'registration open' : 'allowlist sealed'}</p>}
  </section>;
}
