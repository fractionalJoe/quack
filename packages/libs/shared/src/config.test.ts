import { test } from "node:test";
import assert from "node:assert/strict";
import { config } from "./config.ts";

const expected = ["region", "webHostname", "apiHostname", "googleClientId", "vpcName", "auroraCluster"];
const expectedAurora = ["autoPauseSeconds", "defaultDatabaseName"];

test("config.primary has every expected property", () => {
  for (const key of expected) {
    assert.ok(key in config.primary, `missing ${key}`);
  }
});

test("config.primary.auroraCluster has every expected property", () => {
  for (const key of expectedAurora) {
    assert.ok(key in config.primary.auroraCluster, `missing ${key}`);
  }
});

test("config.primary does not have an unexpected property", () => {
  assert.ok(!("fail" in config.primary));
});
