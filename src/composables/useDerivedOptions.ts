import { reactive, toRaw, watch, type Ref, type UnwrapNestedRefs } from 'vue';

/**
 * For options panels whose form doesn't map 1:1 onto the encoder options
 * (a "lossless" checkbox, effort = 10 - speed, ...). Returns a reactive form
 * state derived from `options`. Changes to the form state are written back to
 * `options`, and outside changes to `options` (like importing settings)
 * re-derive the form state.
 */
export function useDerivedOptions<Options extends object, State extends object>(
  options: Ref<Options>,
  fromOptions: (options: Options, previous?: State) => State,
  toOptions: (state: State) => Options,
): UnwrapNestedRefs<State> {
  const state = reactive(fromOptions(options.value)) as UnwrapNestedRefs<State>;
  let lastWritten = JSON.stringify(options.value);

  watch(
    options,
    (newOptions) => {
      if (JSON.stringify(newOptions) === lastWritten) return;
      lastWritten = JSON.stringify(newOptions);
      Object.assign(state, fromOptions(newOptions, toRaw(state) as State));
    },
    { deep: true },
  );

  watch(
    state,
    () => {
      const newOptions = toOptions(state as State);
      if (JSON.stringify(newOptions) === lastWritten) return;
      lastWritten = JSON.stringify(newOptions);
      Object.assign(options.value, newOptions);
    },
    { deep: true },
  );

  return state;
}
