import { test } from "node:test";
import assert from "node:assert/strict";
import { config } from "./config.ts";

const expected = [
  "region",
  "webHostname",
  "apiHostname",
  "googleClientId",
  "vpcName",
  "auroraCluster",
];
const expectedAurora = ["autoPauseSeconds", "defaultDatabaseName"];

test("config.primary has every expected property", () => {
  // given
  const primary = config.primary;

  // when
  const missing = expected.filter((key) => !(key in primary));

  // then
  assert.deepEqual(missing, []);
});

test("config.primary.auroraCluster has every expected property", () => {
  // given
  const aurora = config.primary.auroraCluster;

  // when
  const missing = expectedAurora.filter((key) => !(key in aurora));

  // then
  assert.deepEqual(missing, []);
});

test("config.primary does not have an unexpected property", () => {
  // given
  const primary = config.primary;

  // when
  const present = "fail" in primary;

  // then
  assert.equal(present, false);
});
