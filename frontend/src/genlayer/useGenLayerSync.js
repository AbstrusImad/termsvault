// Background sync for live mode: reads contract stats and reports, then merges
// the on-chain reports into the Vault views (marked Verified on GenLayer).
// Polls gently (>= 90s) so the demo content stays full and the RPC stays calm.
import { useEffect, useRef } from 'react'
import { useVault } from '../store/VaultContext'
import { getGenLayerStatus, fetchChainReports, getGenLayerMode } from './genlayerClient'
import { IS_DEPLOYED } from './realGenLayer'

const POLL_MS = 90000

export function useGenLayerSync() {
  const { settings, setChainStatus, mergeChainReports } = useVault()
  const mode = settings.genlayerMode || (settings.genlayerMockMode ? 'mock' : 'live')
  const timer = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function tick() {
      if (getGenLayerMode() !== 'live') return
      try {
        const status = await getGenLayerStatus()
        if (cancelled) return
        setChainStatus({
          online: !!status.online,
          mode: 'live',
          stats: status.online
            ? { analyses: status.analyses, reports: status.reports, snapshots: status.snapshots }
            : null,
          contract: status.contract || '',
        })
      } catch {
        if (!cancelled) setChainStatus({ online: false })
      }

      if (!IS_DEPLOYED) return
      try {
        const reports = await fetchChainReports(0)
        if (!cancelled && reports.length) mergeChainReports(reports)
      } catch {
        /* ignore transient read failures */
      }
    }

    if (mode === 'live') {
      tick()
      timer.current = setInterval(tick, POLL_MS)
    } else {
      setChainStatus({ online: false, mode: 'mock' })
    }

    return () => {
      cancelled = true
      if (timer.current) clearInterval(timer.current)
    }
  }, [mode, setChainStatus, mergeChainReports])
}
