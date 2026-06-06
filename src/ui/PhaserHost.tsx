import { css } from '@linaria/core'
import { useEffect, useRef } from 'react'
import type { RootStore } from '../stores/RootStore'
import { createGame } from '../game/phaser/createGame'

type PhaserHostProps = {
  store: RootStore
}

const host = css`
  position: absolute;
  inset: 0;

  :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
`

export function PhaserHost({ store }: PhaserHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hostRef.current) {
      return
    }

    const game = createGame(hostRef.current, store)
    return () => {
      game.destroy(true)
    }
  }, [store])

  return <div ref={hostRef} className={host} />
}
