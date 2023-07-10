# Changelog

Headlines: Added, Changed, Deprecated, Removed, Fixed, Security

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]

### Added

- Added `clearOnNavigate` and `clearAfterMs` options. `clearOnNavigate` is `true` as default, `clearAfterMs` can be used to clear the flash message after a certain time (ms).

### Changed

- Removal of flash message when navigating is now automatic - no `afterNavigate` function needed anymore.

### Deprecated

- `initFlash` is deprecated, use `getFlash` instead.
- `loadFlashMessage` is deprecated, use `loadFlash` instead.

## [1.0.1] - 2023-06-24

### Fixed

- Memory leaks in page subscription and context ([#14](https://github.com/ciscoheat/sveltekit-flash-message/pull/14/files), thanks to [Guilherme Pais](https://github.com/stLmpp))

### Added

- Svelte 4 compatibility.
