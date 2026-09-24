import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowClockwise, CheckCircle, Wallet, ShieldCheck } from '@phosphor-icons/react';
import { Button, Modal } from './Primitives';
import { connectWallet, discoverWallets, type WalletSession } from '../lib/wallet';
import { safeError } from '../lib/errors';
import { shortId } from '../lib/bytes';

export function WalletModal({ onClose, onConnected, session, onDisconnect }: { onClose: () => void; onConnected: (session: WalletSession) => void; session: WalletSession | null; onDisconnect: () => void }) {
  const [wallets, setWallets] = useState(discoverWallets);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => { active.current = true; const interval = setInterval(() => setWallets(discoverWallets()), 2000); return () => { active.current = false; clearInterval(interval); }; }, []);
  async function connect(index: number) {
    setBusy(true); setError('');
    try { const result = await connectWallet(wallets[index]); if (active.current) { onConnected(result); onClose(); } }
    catch (err) { if (active.current) setError(safeError(err)); }
    finally { if (active.current) setBusy(false); }
  }
  return <Modal title={session ? 'Your wallet' : 'Make a private connection.'} onClose={onClose}>
    {session ? <><div className="connected-wallet"><CheckCircle size={36} weight="light" /><div><strong>{session.name}</strong><p>{shortId(session.address)}</p></div><span className="status-pill"><i />Preview</span></div><p className="muted">Disconnecting clears invitations and organizer secrets from this tab. To revoke site permissions, use your wallet settings.</p><Button variant="secondary" onClick={onDisconnect}>Disconnect & clear session</Button></> : <>
      <p className="muted">Connect a Midnight wallet on Preview. Your wallet stays in control of every transaction.</p>
      <div className="wallet-options">{wallets.map((wallet, index) => <button className="wallet-option" key={`${wallet.rdns}-${index}`} disabled={busy} onClick={() => void connect(index)}><span className="wallet-emblem"><Wallet size={25} weight="light" aria-hidden="true" /></span><span><strong>{wallet.name}</strong><small>{busy ? 'Check your wallet…' : 'Detected · Connect securely'}</small></span><ArrowUpRight size={22} weight="light" aria-hidden="true" /></button>)}</div>
      {!wallets.length && <div className="wallet-empty"><Wallet size={38} weight="light" aria-hidden="true" /><h3>No compatible wallet detected</h3><p>Install Lace with Midnight support, unlock it and select the Preview network.</p><a className="button primary" href="https://www.lace.io/" target="_blank" rel="noopener noreferrer">Get Lace <span className="button-orbit"><ArrowUpRight size={18} aria-hidden="true" /></span></a><button className="text-button" onClick={() => setWallets(discoverWallets())}><ArrowClockwise size={16} aria-hidden="true" />Check again</button></div>}
      <p className="wallet-note"><ShieldCheck size={18} weight="light" aria-hidden="true" />Veil never asks for your recovery phrase.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {busy && <p className="muted" role="status">Approve the connection in your wallet. You can close this window to cancel this connection attempt.</p>}
    </>}
  </Modal>;
}
