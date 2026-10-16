# Security and privacy

## Scope

Kin is a static, offline-capable family birthday app. There are no accounts,
server-side family database, authentication tokens, analytics, or cloud sync.
Use the latest deployed release. Older snapshots of the code are not maintained
as separate security branches.

Family links, QR codes, JSON backups, calendar files and exported documents are
**readable, not encrypted**. Anyone receiving a family link or QR can recover
its selected names and full birth dates. A link is a portable snapshot, not a
revocable access grant. Deleting a person does not change previously shared
copies. Share only the people needed, and keep backups in a trusted location.

## Review and hardening: 1.14.1

The October 17, 2026 review covers imports, rendering, browser storage, service
worker messages/caching, local serving, shipped dependencies and deployment.

- Family imports retain their 30,000-character input, 21,000-byte expanded,
  150-person and 120-byte UTF-8 name limits. Streaming inflation uses small
  chunks and now accepts only the documented zlib wrapper, rejecting ignored
  trailing bytes. CRC detects accidental corruption; it does not authenticate
  the sender. Review incoming people before keeping or merging them.
- User-controlled names remain literal text through HTML escaping; browser
  tests exercise malicious-looking names through import review and the views.
  Existing calendar-export escaping prevents injected ICS fields.
- Device settings are normalized consistently on initial load and cross-tab
  merge. Invalid groups, duplicate IDs, oversized values, nested unsafe keys
  and prototype-related keys are discarded. Corrupt JSON can be replaced with
  valid settings. This is input hardening, not isolation from malicious
  software that already has access to browser storage.
- Embedded app entry points do not import the application, read saved settings
  or register a service worker. A localized notice asks the person to open Kin
  separately. Sandboxed frames are also tested.
- The CSP disallows inline/evaluated scripts, objects, base-URL changes, form
  submission and child frames. The local static server additionally sends
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff` and a no-referrer
  policy. Worker update requests must come from an in-scope window client.
- Pako 1.0.11 and PDF-LIB 1.17.1 are explicitly locked, included in dependency
  audits and compared against the shipped files before release. The small
  bundled QR implementation is included in source analysis. Fonts/icons are
  local assets; exporting does not call external rendering services.
- Deployment actions are pinned to verified upstream commit IDs, checkout
  credentials are not retained, and dependency lifecycle scripts are disabled
  during CI installation. Any reported dependency vulnerability, including low
  severity, blocks verification. Production deployment needs both browser/unit
  verification and a clean CodeQL security analysis of application, scripts and
  Actions workflows. SARIF output is retained for review; it is not silently
  suppressed. No repository-administration permission is needed for this gate.

Run `npm test`, `npm run test:browser` and `npm audit --audit-level=low` for the
local checks. CodeQL runs in the GitHub workflow. Passing checks and a zero
dependency-audit count do not prove that all vulnerabilities have been found.
This is a source/dependency/browser review, not an independent penetration test.

## Hosting boundaries and remaining operational decisions

GitHub Pages does not provide configurable security response headers here.
`frame-ancestors` cannot be enforced through a CSP meta tag; the startup guard is
defense in depth, **not equivalent to server-enforced anti-framing**. A host that
supports response headers should serve the policy in `dist/index.html` as an
HTTP header with `frame-ancestors 'none'`, plus the headers above. Use HTTPS.
See [MDN's frame-ancestors documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

Browser storage is origin-wide, not path-isolated. Other code hosted at
`https://m7snlibya-lab.github.io/` shares the origin even when its path differs.
Only trusted projects should run on that origin. A dedicated custom domain or
separate hosting origin gives Kin a stronger isolation boundary; selecting and
configuring one requires the owner's domain/hosting choice. Path-specific keys
and worker cache cleanup prevent accidental collisions, not a hostile same-origin
app. Browser extensions, device compromise and account compromise also remain
outside Kin's protection boundary.

Repository owners should enforce multi-factor authentication, restricted write
access, reviewed changes to main and appropriate deployment protections. These
account/administration settings were not changed by this source-code review.
Pin updates should be reviewed and retested; immutable pins do not remove the
need to trust the upstream action or its dependencies. See [GitHub's secure-use
guidance](https://docs.github.com/en/actions/reference/security/secure-use).

## Reporting a concern

Do not put real family links, dates, backup files, credentials or private
screenshots into public issues or logs. Use GitHub's private vulnerability
reporting option if the repository owner has enabled it. Otherwise contact the
owner through a private channel they provide; do not assume public issues are
private. Use synthetic records when reproducing a problem.
