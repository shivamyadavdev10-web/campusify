import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(
  onForeground?: () => void,
  onBackground?: () => void
) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const onForegroundRef = useRef(onForeground);
  const onBackgroundRef = useRef(onBackground);

  onForegroundRef.current = onForeground;
  onBackgroundRef.current = onBackground;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onForegroundRef.current?.();
      } else if (
        appState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        onBackgroundRef.current?.();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  return appState;
}
