import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isAllowedPayTabsIp, verifyHmacSha256 } from "./paytabs.service";

describe("PayTabs webhook security", () => {
  it("accepts an authentic HMAC signature", () => {
    const payload = Buffer.from('{"cart_id":"MH-123","payment_result":{"response_status":"A"}}');
    const secret = "test-server-key";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    expect(verifyHmacSha256(payload, signature, secret)).toBe(true);
  });

  it("rejects malformed or incorrect signatures without throwing", () => {
    const payload = Buffer.from('{"cart_id":"MH-123"}');

    expect(verifyHmacSha256(payload, "short", "test-server-key")).toBe(false);
    expect(verifyHmacSha256(payload, "0".repeat(64), "test-server-key")).toBe(false);
  });

  it("matches exact IPs and CIDR ranges without prefix spoofing", () => {
    expect(isAllowedPayTabsIp("185.166.136.42")).toBe(true);
    expect(isAllowedPayTabsIp("::ffff:178.33.10.248")).toBe(true);
    expect(isAllowedPayTabsIp("185.166.137.42")).toBe(false);
    expect(isAllowedPayTabsIp("178.33.10.248.attacker.example")).toBe(false);
  });
});
