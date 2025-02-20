import assert from "node:assert/strict"
import { describe, it } from "jsr:@std/testing/bdd"
import { Uuid } from "../../src/mod.ts"
import { Buffer } from "node:buffer"

describe("Uuid", () => {
  describe("constructor", function () {
    it("should validate the Buffer length", function () {
      assert.throws(function () {
        return new Uuid(Buffer.allocUnsafe(10))
      })
      assert.doesNotThrow(function () {
        return new Uuid(Buffer.allocUnsafe(16))
      })
    })
  })

  describe("#toString()", function () {
    it("should convert to string representation", function () {
      let val = new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))
      assert.strictEqual(val.toString(), "aabbccdd-eeff-0011-2233-445566778899")
      val = new Uuid(Buffer.from("a1b1ccddeeff00112233445566778899", "hex"))
      assert.strictEqual(val.toString(), "a1b1ccdd-eeff-0011-2233-445566778899")
      val = new Uuid(Buffer.from("ffb1ccddeeff00112233445566778800", "hex"))
      assert.strictEqual(val.toString(), "ffb1ccdd-eeff-0011-2233-445566778800")
    })
  })

  describe("#equals", function () {
    it("should return true only when the values are equal", function () {
      const val = new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))
      const val2 = new Uuid(Buffer.from("ffffffffffff00000000000000000000", "hex"))
      const val3 = new Uuid(Buffer.from("ffffffffffff00000000000000000001", "hex"))
      assert.strictEqual(val.equals(val), true)
      assert.strictEqual(val.equals(new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))), true)
      assert.strictEqual(val.equals(val2), false)
      assert.strictEqual(val.equals(val3), false)
      assert.strictEqual(val2.equals(val3), false)
      assert.strictEqual(val3.equals(val2), false)
    })
  })

  describe("#getBuffer()", function () {
    it("should return the Buffer representation", function () {
      let buf = Buffer.allocUnsafe(16)
      let val = new Uuid(buf)
      assert.strictEqual(val.getBuffer().toString("hex"), buf.toString("hex"))
      buf = Buffer.from("ffffccddeeff00222233445566778813", "hex")
      val = new Uuid(buf)
      assert.strictEqual(val.getBuffer().toString("hex"), buf.toString("hex"))
    })
  })

  describe("fromString()", function () {
    it("should validate that the string", function () {
      assert.throws(function () {
        Uuid.fromString("22")
      })
      assert.throws(function () {
        Uuid.fromString("zzb1ccdd-eeff-0011-2233-445566778800")
      })
      assert.doesNotThrow(function () {
        Uuid.fromString("acb1ccdd-eeff-0011-2233-445566778813")
      })
    })
    it("should contain a valid internal representation", function () {
      let val = Uuid.fromString("acb1ccdd-eeff-0011-2233-445566778813")
      assert.strictEqual(val.getBuffer().toString("hex"), "acb1ccddeeff00112233445566778813")
      val = Uuid.fromString("ffffccdd-eeff-0022-2233-445566778813")
      assert.strictEqual(val.getBuffer().toString("hex"), "ffffccddeeff00222233445566778813")
    })
  })

  describe("random()", function () {
    it("should return a Uuid instance", function () {
      assert.ok(Uuid.random() instanceof Uuid)
    })
    it("should contain the version bits and IETF variant", function () {
      let val = Uuid.random()
      assert.strictEqual(val.toString().charAt(14), "4")
      assert.ok(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0)
      val = Uuid.random()
      assert.strictEqual(val.toString().charAt(14), "4")
      assert.ok(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0)
      val = Uuid.random()
      assert.strictEqual(val.toString().charAt(14), "4")
      assert.ok(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0)
    })
    it("should generate v4 uuids that do not collide", function () {
      const values: Record<string, boolean> = {}
      const length = 100000
      for (let i = 0; i < length; i++) {
        values[Uuid.random().toString()] = true
      }
      assert.strictEqual(Object.keys(values).length, length)
    })
  })
})
