import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Wallet, Check, List, X } from '@phosphor-icons/react';
import { Access } from './components/Access';
import { Organizer } from './components/Organizer';
import { Privacy } from './components/Privacy';
import { Button, Mark } from './components/Primitives';
import { WalletModal } from './components/WalletModal';
import { assertWalletNetwork, type WalletSession } from './lib/wallet';
import type { MidnightClient, Phase } from './lib/midnight';
import { shortId } from './lib/bytes';
import { UserError } from './lib/errors';

type View = 'access' | 'organizer' | 'privacy';
function currentView(): View { const hash = window.location.hash.slice(1); return hash === 'organizer' || hash === 'privacy' ? hash : 'access'; }

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('preparing');
  const [epoch, setEpoch] = useState(0);
  const [notice, setNotice] = useState('');
  const client = useRef<MidnightClient | null>(null);
  const disconnect = useCallback(() => {
    void client.current?.clear(); client.current = null; setWallet(null); setWalletOpen(false); setEpoch((value) => value + 1);
  }, []);
  useEffect(() => {
    const change = () => { setView(currentView()); setMenu(false); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (!wallet || busy) return;
    let active = true;
    const check = () => { if (document.visibilityState === 'visible') void assertWalletNetwork(wallet.api).catch(() => { if (active) { disconnect(); setNotice('Your wallet connection changed. Private session data was cleared. Reconnect on Preview to continue.'); } }); };
    const interval = setInterval(check, 15000);
    window.addEventListener('focus', check);
    return () => { active = false; clearInterval(interval); window.removeEventListener('focus', check); };
  }, [wallet, busy, disconnect]);
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  async function getClient() {
    if (!wallet) throw new UserError('Connect your Midnight wallet first.');
    if (!client.current) { const { createMidnightClient } = await import('./lib/midnight'); client.current = await createMidnightClient(wallet, setPhase); }
    return client.current;
  }
  const connect = () => setWalletOpen(true);
  return <><a className="skip-link" href="#main-content">Skip to content</a><div className="app-shell"><header className="site-header"><a className="brand" href="#access" aria-label="Veil home"><Mark size={36} /><span translate="no">veil</span><span className="brand-divider" /><span className="brand-caption">A little more private.</span></a><nav className={`main-nav ${menu ? 'expanded' : ''}`} aria-label="Main navigation">{(['access', 'organizer', 'privacy'] as const).map((item) => <a href={`#${item}`} key={item} aria-current={view === item ? 'page' : undefined}>{item === 'access' ? 'Your access' : item === 'organizer' ? 'For organizers' : 'Privacy'}</a>)}</nav><div className="header-actions"><span className="network-label"><i />Preview</span><Button variant="secondary" className="connect-header" disabled={busy} onClick={connect}>{wallet ? <Check size={16} weight="light" /> : <Wallet size={17} weight="light" aria-hidden="true" />}<span>{wallet ? shortId(wallet.address) : 'Connect wallet'}</span></Button><button className="icon-button mobile-menu" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={23} /> : <List size={23} />}</button></div></header>
    {notice && <div className="session-notice" role="status">{notice}<button className="icon-button" aria-label="Dismiss connection notice" onClick={() => setNotice('')}><X size={16} /></button></div>}
    <main id="main-content"><div hidden={view !== 'access'}><Access key={`access-${epoch}`} wallet={wallet} connect={connect} getClient={getClient} phase={phase} setBusy={setBusy} /></div><div hidden={view !== 'organizer'}><Organizer key={`organizer-${epoch}`} wallet={wallet} connect={connect} getClient={getClient} phase={phase} setBusy={setBusy} /></div><div hidden={view !== 'privacy'}><Privacy /></div></main>
    <footer className="site-footer"><a href="#access" className="footer-brand"><Mark size={23} /><span>Privacy opens doors.</span></a><div><span>Built on <a href="https://midnight.network/" target="_blank" rel="noopener noreferrer" className="midnight-wordmark">Midnight <ArrowUpRight size={12} weight="light" aria-hidden="true" /></a></span><span className="footer-separator" /><span>Rise In · Level 3</span></div><span className="footer-right">A more private kind of belonging.</span></footer>
  </div>{walletOpen && <WalletModal session={wallet} onClose={() => setWalletOpen(false)} onConnected={(value) => { setWallet(value); setNotice(''); }} onDisconnect={disconnect} />}</>;
}
