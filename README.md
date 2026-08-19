# ebay-automation

Static pages that exist to satisfy the eBay Developers Program's redirect and
privacy-policy URL requirements. Nothing here is an application.

The eBay RuName form needs three HTTPS URLs. These pages provide them:

| RuName field | URL |
|---|---|
| Accept URL | `https://jostergaard.github.io/ebay-automation/` |
| Decline URL | `https://jostergaard.github.io/ebay-automation/` |
| Privacy policy URL | `https://jostergaard.github.io/ebay-automation/privacy.html` |

## `index.html` — OAuth redirect target

After granting consent, eBay redirects the browser here with a temporary
authorization `code` in the query string. The page reads it out of the address bar
and shows it, with a copy button, so it can be pasted into the local tool that
exchanges it for a token.

It hands over the **whole URL** rather than the bare code, because eBay's codes
contain percent-encoded `%23` and `%5E` sequences that are easy to truncate when
copying by hand.

The same page handles the decline case, where eBay returns `?error=access_denied`
instead of a code.

Entirely client-side: no server, no storage, no cookies, no analytics, and the
code is never transmitted anywhere. The authorization code is single-use and
expires within minutes, so it is exchanged immediately and is worthless
afterwards.

## `privacy.html`

The privacy policy the RuName form requires.

## Enabling Pages

Settings → Pages → deploy from branch `main`, folder `/ (root)`.
