import { page } from '$app/state';
import { getFlash, initFlash, updateFlash } from '../src/lib/client.js';

// Compile-time regression check for APIs accepting pages with optional route params.
// This function is intentionally never called; `pnpm check` validates the calls below.
export function acceptsOptionalRouteParams() {
  const params: { lang?: string | undefined } = {};
  const optionalPage = { ...page, params };

  getFlash(optionalPage);
  initFlash(optionalPage);
  void updateFlash(optionalPage);
}
