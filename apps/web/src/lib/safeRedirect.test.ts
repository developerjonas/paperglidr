import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/courses", "/courses"],
    ["/products/abc/purchase", "/products/abc/purchase"],
    ["/browse?q=loksewa#top", "/browse?q=loksewa#top"],
    ["/a/../b", "/b"],
  ])("keeps the relative path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "http://evil.example/courses",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    "/\tevil",
    "/\n/evil.example",
    "courses",
    "",
    "/sign-in",
    "/sign-up?redirectTo=/x",
  ])("rejects %j", (input) => {
    expect(safeRedirectPath(input)).toBe("/");
  });

  it("rejects non-strings and uses the fallback", () => {
    expect(safeRedirectPath(undefined, "/courses")).toBe("/courses");
    expect(safeRedirectPath(["/a", "/b"])).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
  });
});
