# eBay account-deletion endpoint (Cloudflare Worker)

Only needed if you cannot claim exemption. Exemption applies when you do not
persist other eBay users' personal data — which is the case for listing your own
inventory.

GitHub Pages cannot serve this: the endpoint must compute a hash and reply.

## Deploy

```sh
npm install -g wrangler
wrangler login
wrangler deploy                      # prints your workers.dev URL

# choose any 32-80 char token of letters/digits/_/- and keep it
wrangler secret put VERIFICATION_TOKEN

# the exact URL from the deploy output, byte-identical to the portal value
wrangler secret put ENDPOINT_URL
```

Then in the developer portal, set the endpoint to that URL and the verification
token to the same value, and click **Send Test Notification**.

## The one thing that usually fails

The hash is `sha256(challengeCode + verificationToken + endpointUrl)` with no
separators, and `endpointUrl` must match what you typed in the portal exactly —
including scheme, host, path, and any trailing slash. If they differ by one
character the hash will not match and validation fails with no useful detail.

## Verify locally before pointing eBay at it

```sh
wrangler dev
curl -s "http://127.0.0.1:8787/?challenge_code=TEST" | jq
```

Compare against the expected value:

```sh
python3 - <<'PY'
import hashlib
challenge, token, endpoint = "TEST", "<your token>", "<your endpoint url>"
print(hashlib.sha256((challenge + token + endpoint).encode()).hexdigest())
PY
```
