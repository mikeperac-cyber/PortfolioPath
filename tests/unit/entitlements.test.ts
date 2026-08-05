import assert from "node:assert/strict"
import { describe,it } from "node:test"
import { canAssignStudent,canCreateProject,projectIdeaLimit } from "@/lib/entitlements"
describe("plan entitlements",()=>{it("enforces project limits",()=>{assert.equal(canCreateProject({project_limit:1},0),true);assert.equal(canCreateProject({project_limit:1},1),false);assert.equal(canCreateProject({project_limit:3},2),true)});it("caps ideas at exactly three",()=>{assert.equal(projectIdeaLimit({idea_count:8}),3);assert.equal(projectIdeaLimit({idea_count:0}),1)});it("limits counselor rosters",()=>{assert.equal(canAssignStudent({student_limit:25},24),true);assert.equal(canAssignStudent({student_limit:25},25),false)})})
