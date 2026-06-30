/** entry.js から defer する Web 副作用（NativeWind pressable remap 等）。 */
export function loadDeferredWebEntrySideEffects(): void {
  void import("@/lib/_core/nativewind-pressable");
}
