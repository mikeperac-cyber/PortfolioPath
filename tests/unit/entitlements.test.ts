import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeDiscountPercent,
  canAssignStudent,
  canCreateProject,
  discountedAmountTry,
  entitlementsFromAccessGrants,
  projectIdeaLimit,
} from "@/lib/entitlements";
import { buildIyzicoAuthorization } from "@/lib/payments/iyzico-signature";

describe("plan entitlements", () => {
  it("enforces project limits", () => {
    assert.equal(canCreateProject({ project_limit: 1 }, 0), true);
    assert.equal(canCreateProject({ project_limit: 1 }, 1), false);
    assert.equal(canCreateProject({ project_limit: 3 }, 2), true);
  });

  it("caps ideas at exactly three", () => {
    assert.equal(projectIdeaLimit({ idea_count: 8 }), 3);
    assert.equal(projectIdeaLimit({ idea_count: 0 }), 1);
  });

  it("limits counselor rosters", () => {
    assert.equal(canAssignStudent({ student_limit: 25 }, 24), true);
    assert.equal(canAssignStudent({ student_limit: 25 }, 25), false);
  });

  it("does not treat a discount as paid access", () => {
    const grants = [
      {
        grant_kind: "discount" as const,
        plan_id: "complete",
        discount_percent: 25,
        entitlements: { workspace: true },
        plans: { entitlements: { portfolio: true } },
      },
      {
        grant_kind: "complimentary" as const,
        plan_id: "blueprint",
        discount_percent: null,
        entitlements: { download_plan: true },
        plans: null,
      },
    ];
    assert.deepEqual(entitlementsFromAccessGrants(grants), [
      { download_plan: true },
      undefined,
    ]);
    assert.equal(activeDiscountPercent(grants, "complete"), 25);
    assert.equal(discountedAmountTry(5500, 25), 4125);
    assert.throws(() => discountedAmountTry(5500, 100), /complimentary grant/);
  });

  it("uses the documented IYZWSv2 authorization shape", () => {
    const authorization = buildIyzicoAuthorization({
      apiKey: "api",
      secretKey: "secret",
      randomKey: "rnd",
      path: "/payment/test",
      bodyText: JSON.stringify({ locale: "en", price: 12 }),
    });
    assert.equal(
      authorization,
      "IYZWSv2 YXBpS2V5OmFwaSZyYW5kb21LZXk6cm5kJnNpZ25hdHVyZTo0ZDMzMjQzOTc5NmY2YTkzOGUyNTdjMGY4N2M0ZTVkYWEzMGQ2NjBmZDRkODE2MTY5ZGYzZTk3ZmQ1NjVhMjE0",
    );
  });
});
