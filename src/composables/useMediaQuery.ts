import { onScopeDispose, shallowRef } from 'vue';

/** Whether a media query currently matches, kept up to date. */
export function useMediaQuery(query: string) {
  const mediaQuery = matchMedia(query);
  const matches = shallowRef(mediaQuery.matches);
  const onChange = () => (matches.value = mediaQuery.matches);
  mediaQuery.addEventListener('change', onChange);
  onScopeDispose(() => mediaQuery.removeEventListener('change', onChange));
  return matches;
}
