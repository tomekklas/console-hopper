import { describe, it, expect } from "vitest";
import {
  GLOBAL_SERVICE_KEYS,
  LOOP_GUARD_MS,
  nextTabState,
  parseConsolePage,
  planRegionLock,
  regionSwapUrl,
} from "../src/shared/region-lock.js";

const FRANKFURT = "eu-central-1";
const STOCKHOLM = "eu-north-1";

const page = (href) => parseConsolePage(href);
const regional = (region, service) =>
  page(
    `https://${region}.console.aws.amazon.com/${service}/home?region=${region}`
  );

describe("parseConsolePage", () => {
  it("reads the region off both console host shapes", () => {
    expect(
      page("https://eu-central-1.console.aws.amazon.com/ec2/home")
    ).toMatchObject({
      region: "eu-central-1",
      serviceKey: "ec2",
      isGlobal: false,
    });
    expect(
      page("https://123456789012-abc1.eu-west-1.console.aws.amazon.com/s3/home")
    ).toMatchObject({ region: "eu-west-1", serviceKey: "s3", isGlobal: false });
  });

  it("treats a region-less host as global, differentiator or not", () => {
    expect(page("https://console.aws.amazon.com/iam/home").isGlobal).toBe(true);
    expect(
      page("https://support.console.aws.amazon.com/support/home").isGlobal
    ).toBe(true);
    expect(
      page("https://123456789012-abc1.console.aws.amazon.com/ec2/home")
    ).toMatchObject({
      region: "",
      isGlobal: true,
    });
  });

  it("marks the globals AWS parks on a regional host", () => {
    // console.aws.amazon.com/iam/home redirects to us-east-1.console.aws.amazon.com,
    // so a region in the host is not enough to call a page regional.
    expect(
      page("https://us-east-1.console.aws.amazon.com/iam/home")
    ).toMatchObject({
      region: "us-east-1",
      isGlobal: true,
    });
    for (const key of GLOBAL_SERVICE_KEYS) {
      expect(
        page(`https://us-east-1.console.aws.amazon.com/${key}/home`).isGlobal
      ).toBe(true);
    }
  });

  it("rejects anything that isn't an https AWS console page", () => {
    expect(page("https://signin.aws.amazon.com/saml")).toBeNull();
    expect(
      page("https://console.aws.amazon.com.evil.test/ec2/home")
    ).toBeNull();
    expect(
      page("http://eu-central-1.console.aws.amazon.com/ec2/home")
    ).toBeNull();
    expect(page("not a url")).toBeNull();
    expect(page("")).toBeNull();
  });
});

describe("regionSwapUrl", () => {
  it("swaps the host segment and the region= value, keeping everything else", () => {
    expect(
      regionSwapUrl(
        "https://eu-north-1.console.aws.amazon.com/ec2/v2/home?region=eu-north-1&x=%2Fa%2Fb#Instances:v=3",
        FRANKFURT
      )
    ).toBe(
      "https://eu-central-1.console.aws.amazon.com/ec2/v2/home?region=eu-central-1&x=%2Fa%2Fb#Instances:v=3"
    );
  });

  it("swaps the region segment of a multi-session host", () => {
    expect(
      regionSwapUrl(
        "https://123456789012-abc1.eu-north-1.console.aws.amazon.com/s3/home",
        FRANKFURT
      )
    ).toBe(
      "https://123456789012-abc1.eu-central-1.console.aws.amazon.com/s3/home"
    );
  });

  it("returns null when there is nothing to swap", () => {
    expect(
      regionSwapUrl("https://console.aws.amazon.com/iam/home", FRANKFURT)
    ).toBeNull();
    expect(
      regionSwapUrl(
        "https://eu-central-1.console.aws.amazon.com/ec2/home",
        FRANKFURT
      )
    ).toBeNull();
    expect(
      regionSwapUrl(
        "https://eu-north-1.console.aws.amazon.com/ec2/home",
        "not-a-region"
      )
    ).toBeNull();
  });
});

describe("planRegionLock", () => {
  it("leaves global consoles alone and never pins their region", () => {
    const plan = planRegionLock({
      page: page("https://us-east-1.console.aws.amazon.com/iam/home"),
      pinned: FRANKFURT,
      prev: { serviceKey: "ec2", isGlobal: false },
    });
    expect(plan.action).toBe("none");
  });

  it("adopts the region of the first regional page in a tab", () => {
    expect(
      planRegionLock({ page: regional(FRANKFURT, "ec2"), pinned: "" })
    ).toMatchObject({
      action: "adopt",
      region: FRANKFURT,
    });
  });

  it("sends a tab back to its region after a global console", () => {
    // The reported bug: jump lands in Frankfurt, user opens IAM, then EC2.
    const plan = planRegionLock({
      page: regional(STOCKHOLM, "ec2"),
      pinned: FRANKFURT,
      prev: { serviceKey: "iam", isGlobal: true },
    });
    expect(plan.action).toBe("correct");
    expect(plan.region).toBe(FRANKFURT);
    expect(plan.url).toBe(
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1"
    );
  });

  it("follows the user when they change region from AWS's own picker", () => {
    // Same service, different region: that is the region picker, not a bounce.
    expect(
      planRegionLock({
        page: regional(STOCKHOLM, "ec2"),
        pinned: FRANKFURT,
        prev: { serviceKey: "ec2", isGlobal: false },
      })
    ).toMatchObject({ action: "adopt", region: STOCKHOLM });
  });

  it("corrects a stale region carried into a different service", () => {
    expect(
      planRegionLock({
        page: regional(STOCKHOLM, "s3"),
        pinned: FRANKFURT,
        prev: { serviceKey: "ec2", isGlobal: false },
      })
    ).toMatchObject({ action: "correct", region: FRANKFURT });
  });

  it("does nothing when the page is already in the pinned region", () => {
    expect(
      planRegionLock({
        page: regional(FRANKFURT, "ec2"),
        pinned: FRANKFURT,
        prev: { serviceKey: "iam", isGlobal: true },
      })
    ).toMatchObject({ action: "none" });
  });

  it("rescues a tab that has only ever seen a global console", () => {
    // Bookmark straight to IAM, then EC2: nothing was pinned, so the General
    // Settings region stands in for what the user meant.
    expect(
      planRegionLock({
        page: regional(STOCKHOLM, "ec2"),
        pinned: "",
        prev: { serviceKey: "iam", isGlobal: true },
        fallback: FRANKFURT,
      })
    ).toMatchObject({ action: "correct", region: FRANKFURT });
  });

  it("does not rescue when there is no configured region to rescue to", () => {
    expect(
      planRegionLock({
        page: regional(STOCKHOLM, "ec2"),
        pinned: "",
        prev: { serviceKey: "iam", isGlobal: true },
        fallback: "",
      })
    ).toMatchObject({ action: "adopt", region: STOCKHOLM });
  });

  it("honours an external deep link into another region", () => {
    // No previous console page in this tab: a link from a ticket names its own
    // region and the lock has no business overriding it.
    expect(
      planRegionLock({
        page: regional("eu-west-1", "rds"),
        pinned: "",
        prev: null,
      })
    ).toMatchObject({ action: "adopt", region: "eu-west-1" });
  });

  it("stops after one attempt when AWS refuses the correction", () => {
    const target =
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1";
    const args = {
      page: regional(STOCKHOLM, "ec2"),
      pinned: FRANKFURT,
      prev: { serviceKey: "iam", isGlobal: true },
      tried: { url: target, ts: 1_000_000 },
    };
    expect(planRegionLock({ ...args, now: 1_000_000 + 1000 })).toMatchObject({
      action: "none",
      reason: "loop-guard",
    });
    // The guard expires, so a later bounce through IAM is fixed again.
    expect(
      planRegionLock({ ...args, now: 1_000_000 + LOOP_GUARD_MS + 1 })
    ).toMatchObject({ action: "correct", region: FRANKFURT });
  });

  it("ignores a pinned or fallback value that isn't a region code", () => {
    expect(
      planRegionLock({
        page: regional(STOCKHOLM, "ec2"),
        pinned: "../evil",
        prev: { serviceKey: "iam", isGlobal: true },
      })
    ).toMatchObject({ action: "adopt", region: STOCKHOLM });
  });
});

describe("a tab's browsing sequence", () => {
  // Walk a tab through real navigations exactly as the service worker does:
  // parse the URL, plan against the tab's state, fold the result back in.
  const walk = (hrefs, { fallback = "" } = {}) => {
    let state = {};
    const trail = [];
    for (const href of hrefs) {
      const p = parseConsolePage(href);
      const plan = planRegionLock({
        page: p,
        pinned: state.pinned,
        prev: state.prev,
        fallback,
        tried: state.tried,
      });
      state = nextTabState({ state, page: p, plan });
      trail.push({
        action: plan.action,
        url: plan.url || null,
        pinned: state.pinned,
      });
    }
    return trail;
  };

  it("brings a Frankfurt tab back from IAM instead of leaving it in Stockholm", () => {
    const trail = walk([
      // Jump lands on EC2 in Frankfurt.
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1",
      // IAM: global, so AWS drops the region from the host.
      "https://us-east-1.console.aws.amazon.com/iam/home",
      // Back to EC2 — AWS uses the identity's default Region, not ours.
      "https://eu-north-1.console.aws.amazon.com/ec2/home?region=eu-north-1",
    ]);
    expect(trail.map((t) => t.action)).toEqual(["adopt", "none", "correct"]);
    expect(trail[2].url).toBe(
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1"
    );
    expect(trail[2].pinned).toBe(FRANKFURT);
  });

  it("settles after the correction lands", () => {
    const trail = walk([
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1",
      "https://us-east-1.console.aws.amazon.com/iam/home",
      "https://eu-north-1.console.aws.amazon.com/ec2/home?region=eu-north-1",
      // The correction we just issued arrives — and must not bounce again.
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1",
      // Nor should the next ordinary service.
      "https://eu-central-1.console.aws.amazon.com/s3/home?region=eu-central-1",
    ]);
    expect(trail.map((t) => t.action)).toEqual([
      "adopt",
      "none",
      "correct",
      "none",
      "none",
    ]);
  });

  it("keeps a deliberate region switch across a global console", () => {
    const trail = walk([
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1",
      // User picks Ireland from AWS's region menu: same service, new region.
      "https://eu-west-1.console.aws.amazon.com/ec2/home?region=eu-west-1",
      "https://us-east-1.console.aws.amazon.com/billing/home",
      // Coming back must return to Ireland, not to where the tab started.
      "https://eu-north-1.console.aws.amazon.com/s3/home?region=eu-north-1",
    ]);
    expect(trail.map((t) => t.action)).toEqual([
      "adopt",
      "adopt",
      "none",
      "correct",
    ]);
    expect(trail[3].url).toBe(
      "https://eu-west-1.console.aws.amazon.com/s3/home?region=eu-west-1"
    );
  });

  it("rescues a tab that started on a global console", () => {
    const trail = walk(
      [
        // Bookmark straight to IAM: nothing regional to pin yet.
        "https://us-east-1.console.aws.amazon.com/iam/home",
        "https://eu-north-1.console.aws.amazon.com/ec2/home?region=eu-north-1",
      ],
      { fallback: FRANKFURT }
    );
    expect(trail.map((t) => t.action)).toEqual(["none", "correct"]);
    expect(trail[1].pinned).toBe(FRANKFURT);
  });

  it("stays out of the way in a tab that never leaves one region", () => {
    const trail = walk([
      "https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1",
      "https://eu-central-1.console.aws.amazon.com/s3/home?region=eu-central-1",
      "https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1",
    ]);
    expect(trail.map((t) => t.action)).toEqual(["adopt", "none", "none"]);
  });

  it("works the same on multi-session hosts", () => {
    const trail = walk([
      "https://123456789012-ab12.eu-central-1.console.aws.amazon.com/ec2/home",
      // AWS drops the region segment for the global console.
      "https://123456789012-ab12.console.aws.amazon.com/iam/home",
      "https://123456789012-ab12.eu-north-1.console.aws.amazon.com/ec2/home",
    ]);
    expect(trail.map((t) => t.action)).toEqual(["adopt", "none", "correct"]);
    expect(trail[2].url).toBe(
      "https://123456789012-ab12.eu-central-1.console.aws.amazon.com/ec2/home"
    );
  });
});
