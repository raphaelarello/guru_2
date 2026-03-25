import { useEffect, useRef } from 'react';

/**
 * Hook para executar uma função em intervalos regulares
 * @param callback Função a ser executada
 * @param delay Intervalo em ms (null para pausar)
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect((): (() => void) | undefined => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    return undefined;
  }, [delay]);
}
