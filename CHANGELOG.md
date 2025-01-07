# Changelog

Headlines: Added, Changed, Deprecated, Removed, Fixed, Security

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Svelte 5 compatibility with [$app/state](https://svelte.dev/docs/kit/$app-state).

## [2.4.3] - 2024-03-08

### Fixed

- `redirect` with two parameters accepted a `Cookies` object, which wouldn't work as the redirect url couldn't be detected.

## [2.4.2] - 2024-02-16

### Added

- Compatibility with Svelte 5

## [2.4.1] - 2024-01-25

### Fixed

- Removed debug messages.

## [2.4.0] - 2024-01-24

### Fixed

- SvelteKit 2 redirect issue fixed.
- Options for `getFlash` affects routes below.

### Added

- Reintroduced `initFlash`, since [flash options](https://github.com/ciscoheat/sveltekit-flash-message?tab=readme-ov-file#flash-message-options) are now properly affecting routes below.

## [2.3.1] - 2024-01-07

### Fixed

- Options weren't compared properly, causing problems when navigating.

## [2.3.0] - 2023-12-15

### Added

- The `redirect` function can now take the [cookies](https://kit.svelte.dev/docs/load#cookies) object as well as the whole RequestEvent.

### Fixed

- Peer dependency support for SvelteKit 2. ([#32](https://github.com/ciscoheat/sveltekit-flash-message/issues/32))

## [2.2.2] - 2023-11-13

### Fixed

- Options couldn't be set in different top-level layouts.

## [2.2.1] - 2023-09-11

### Fixed

- Flash message didn't appear when posting to a form action on a different route. ([#26](https://github.com/ciscoheat/sveltekit-flash-message/issues/26))

## [2.2.0] - 2023-08-18

### Fixed

- Default cookie option for `SameSite` (strict) wasn't set on the client.

### Added

- `flashCookieOptions` added to `getFlash` options.

## [2.1.3] - 2023-08-09

### Fixed

- `afterNavigate` fix when automatically clearing the flash message.
- Flash message didn't appear when redirecting after `setFlash`.

## [2.1.1] - 2023-08-08

### Fixed

- Compatibility with vitest `^0.34.1`.

### Added

- The client part of the library can now be imported directly from `sveltekit-flash-message`, instead of `sveltekit-flash-message/client`. (The latter also works, for compatibility.)

## [2.1.0] - 2023-07-16

### Added

- Added `flashCookieOptions` object that can be imported from `sveltekit-flash-message/server` and used to set cookie options.

### Security

- Default cookie option for `sameSite` is set to `strict`.

## [2.0.0] - 2023-07-10

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
