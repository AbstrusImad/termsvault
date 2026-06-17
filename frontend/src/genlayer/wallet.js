// Real wallet connection for GenLayer Bradbury via an injected provider.
//
// Holds the live wallet client (which cannot be serialized into localStorage)
// as module state, and exposes a subscribe API so the UI can mirror the
// connected address and network status. The Vault store only persists the
// shallow { connected, address } pair for display.
import { makeWalletClient } from './realGenLayer'

export const BRADBURY = {
  chainId: '0x107D', // 4221
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
}

const TARGET_CHAIN_ID = BRADBURY.chainId.toLowerCase()

let state = {
  connected: false,
  address: '',
  client: null,
  chainOk: false,
}

const listeners = new Set()

function emit() {
  for (const fn of listeners) {
    try {
      fn(getPublicState())
    } catch {
      /* listener errors must not break the wallet */
    }
  }
}

function setState(patch) {
  state = { ...state, ...patch }
  emit()
}

// Public state never includes the raw client object.
function getPublicState() {
  return {
    connected: state.connected,
    address: state.address,
    chainOk: state.chainOk,
    hasProvider: hasInjectedProvider(),
  }
}

export function getWalletState() {
  return getPublicState()
}

export function getWalletClient() {
  return state.client
}

export function getWalletAddress() {
  return state.address
}

export function isWalletReady() {
  return !!(state.connected && state.client)
}

export function hasInjectedProvider() {
  return typeof window !== 'undefined' && !!window.ethereum
}

export function getProvider() {
  return typeof window !== 'undefined' ? window.ethereum : undefined
}

export function subscribeWallet(fn) {
  listeners.add(fn)
  fn(getPublicState())
  return () => listeners.delete(fn)
}

async function ensureChain(provider) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BRADBURY.chainId }],
    })
  } catch (err) {
    // 4902 = chain not added. Some wallets surface -32603 for the same case.
    if (err && (err.code === 4902 || err.code === -32603)) {
      await provider.request({ method: 'wallet_addEthereumChain', params: [BRADBURY] })
    } else if (err && err.code === 4001) {
      throw err // user rejected the network switch
    } else {
      // Best effort: try adding the chain, ignore if it still fails.
      try {
        await provider.request({ method: 'wallet_addEthereumChain', params: [BRADBURY] })
      } catch {
        /* leave chainOk false; reads still work, writes will prompt again */
      }
    }
  }
}

async function readChainOk(provider) {
  try {
    const cid = await provider.request({ method: 'eth_chainId' })
    return String(cid).toLowerCase() === TARGET_CHAIN_ID
  } catch {
    return false
  }
}

let eventsBound = false

function bindEvents(provider) {
  if (eventsBound || !provider || typeof provider.on !== 'function') return
  eventsBound = true
  provider.on('accountsChanged', (accounts) => {
    if (!accounts || !accounts.length) {
      disconnectWallet()
      return
    }
    const address = accounts[0]
    setState({ address, client: makeWalletClient(address, provider) })
  })
  provider.on('chainChanged', (cid) => {
    setState({ chainOk: String(cid).toLowerCase() === TARGET_CHAIN_ID })
  })
}

export async function connectWallet() {
  const provider = getProvider()
  if (!provider) {
    const e = new Error('NO_PROVIDER')
    e.code = 'NO_PROVIDER'
    throw e
  }
  const accounts = await provider.request({ method: 'eth_requestAccounts' })
  const address = accounts && accounts[0]
  if (!address) {
    const e = new Error('NO_ACCOUNT')
    e.code = 'NO_ACCOUNT'
    throw e
  }
  await ensureChain(provider)
  const chainOk = await readChainOk(provider)
  const client = makeWalletClient(address, provider)
  setState({ connected: true, address, client, chainOk })
  bindEvents(provider)
  return { address, chainOk }
}

export function disconnectWallet() {
  setState({ connected: false, address: '', client: null, chainOk: false })
}
