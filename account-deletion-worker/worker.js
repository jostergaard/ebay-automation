/**
 * eBay Marketplace Account Deletion / Closure notification endpoint.
 *
 * Deploy on Cloudflare Workers (free tier is ample). GitHub Pages cannot do this
 * job: the endpoint has to compute a hash and reply, which a static host cannot.
 *
 * Two behaviours eBay requires:
 *
 *   GET  ?challenge_code=XYZ
 *        -> 200, application/json, {"challengeResponse": sha256hex(
 *             challengeCode + verificationToken + endpointUrl)}
 *        The three values are concatenated in EXACTLY that order with no
 *        separators, and endpointUrl must be byte-identical to the URL entered in
 *        the developer portal -- same scheme, host, and path, no trailing slash
 *        difference. A mismatch here is the usual cause of "endpoint validation
 *        failed", because the hash is computed over a URL eBay did not send.
 *
 *   POST <notification body>
 *        -> 200 quickly. eBay retries on non-2xx, so acknowledge first and do any
 *        work afterwards. There is nothing to delete here: this project stores no
 *        eBay user personal data, only its own hardware test records.
 *
 * Configure as Worker secrets/vars, never in code:
 *   VERIFICATION_TOKEN  32-80 chars, letters/digits/_/- only. You choose it, and
 *                       paste the same value into the developer portal.
 *   ENDPOINT_URL        the exact URL you entered in the portal.
 */

const encoder = new TextEncoder();

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    // eBay rejects the challenge reply unless this is application/json.
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const challengeCode = url.searchParams.get("challenge_code");
      if (!challengeCode) {
        // Not eBay's validation call -- a browser or a health check.
        return new Response(
          "eBay marketplace account deletion endpoint. Ready.\n",
          { status: 200, headers: { "content-type": "text/plain" } },
        );
      }
      const token = env.VERIFICATION_TOKEN;
      const endpoint = env.ENDPOINT_URL;
      if (!token || !endpoint) {
        // Fail loudly rather than returning a hash eBay cannot match.
        return json(
          { error: "VERIFICATION_TOKEN and ENDPOINT_URL must be configured" },
          500,
        );
      }
      const challengeResponse = await sha256Hex(challengeCode + token + endpoint);
      return json({ challengeResponse });
    }

    if (request.method === "POST") {
      // Acknowledge immediately; eBay retries anything that is not 2xx.
      let username = null;
      try {
        const body = await request.json();
        username = body?.notification?.data?.username ?? null;
      } catch {
        // A malformed body is still acknowledged: retrying will not fix it, and
        // withholding the 200 just generates repeat deliveries.
      }
      console.log(
        "account deletion notification received",
        username ? `for ${username}` : "(no username parsed)",
        "- no stored eBay user data to delete",
      );
      return new Response(null, { status: 200 });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  },
};
