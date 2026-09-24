import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { NETWORK } from './invitation';
import { UserError, withTimeout } from './errors';

export interface WalletSession { api: ConnectedAPI; name: string; address: string }

export function discoverWallets(scope: Record<string, unknown> | undefined = typeof window === 'undefined' ? undefined : window.midnight): InitialAPI[] {
  return Object.values(scope ?? {}).filter((value): value is InitialAPI => {
    if (!value || typeof value !== 'object') return false;
    const api = value as Partial<InitialAPI>;
    return typeof api.connect === 'function' && typeof api.name === 'string' && typeof api.apiVersion === 'string' && /^4\./.test(api.apiVersion);
  });
}

export async function assertWalletNetwork(api: ConnectedAPI) {
  const status = await api.getConnectionStatus();
  if (status.status !== 'connected') throw new UserError('Your wallet disconnected. Connect again to continue.');
  const config = await api.getConfiguration();
  if (config.networkId !== NETWORK) throw new UserError('Switch your Midnight wallet to Preview, then reconnect to Veil.');
  return config;
}

export async function connectWallet(wallet: InitialAPI): Promise<WalletSession> {
  return withTimeout((async () => {
    const api = await wallet.connect(NETWORK);
    await assertWalletNetwork(api);
    const { shieldedAddress } = await api.getShieldedAddresses();
    if (!shieldedAddress) throw new UserError('The wallet did not return an address. Unlock it and try again.');
    return { api, name: wallet.name, address: shieldedAddress };
  })(), 60000, 'The wallet did not respond. Unlock the extension, close any old request and try again.');
}
