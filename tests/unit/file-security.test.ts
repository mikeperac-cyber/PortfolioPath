import assert from "node:assert/strict"
import { describe,it } from "node:test"
import { assertFileMatches } from "@/lib/file-security"
describe("evidence upload validation",()=>{it("accepts matching safe files",()=>{assert.equal(assertFileMatches("field notes.pdf","application/pdf",1024),"field-notes.pdf")});it("rejects MIME spoofing",()=>{assert.throws(()=>assertFileMatches("certificate.exe","application/pdf",1024),/extension/)});it("rejects oversized uploads",()=>{assert.throws(()=>assertFileMatches("video.mp4","video/mp4",26_214_401),/25 MiB/)})})
