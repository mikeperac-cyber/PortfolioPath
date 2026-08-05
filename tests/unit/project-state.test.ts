import assert from "node:assert/strict"
import { describe,it } from "node:test"
import { assertProjectTransition,canTransitionProject } from "@/lib/project-state"
describe("project lifecycle",()=>{it("supports counselor review and activation",()=>{assert.equal(canTransitionProject("draft","awaiting_counselor_review"),true);assert.equal(canTransitionProject("awaiting_counselor_review","approved"),true);assert.equal(canTransitionProject("approved","active"),true)});it("rejects unsupported shortcuts",()=>{assert.throws(()=>assertProjectTransition("draft","completed"),/Invalid project status transition/);assert.equal(canTransitionProject("archived","active"),false)})})
