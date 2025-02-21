import { assertEquals, assertInstanceOf, assertThrows } from "jsr:@std/assert"
import { describe, it } from "jsr:@std/testing/bdd"
import { Buffer } from "node:buffer"
import { Uuid } from "../../src/mod.ts"

describe("Uuid", () => {
  describe("constructor", function () {
    it("should validate the Buffer length", function () {
      assertThrows(function () {
        return new Uuid(Buffer.allocUnsafe(10))
      })
      assertInstanceOf(new Uuid(Buffer.allocUnsafe(16)), Uuid)
    })
  })

  describe("#toString()", function () {
    it("should convert to string representation", function () {
      let val = new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))
      assertEquals(val.toString(), "aabbccdd-eeff-0011-2233-445566778899")
      val = new Uuid(Buffer.from("a1b1ccddeeff00112233445566778899", "hex"))
      assertEquals(val.toString(), "a1b1ccdd-eeff-0011-2233-445566778899")
      val = new Uuid(Buffer.from("ffb1ccddeeff00112233445566778800", "hex"))
      assertEquals(val.toString(), "ffb1ccdd-eeff-0011-2233-445566778800")
    })
  })

  describe("#equals", function () {
    it("should return true only when the values are equal", function () {
      const val = new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))
      const val2 = new Uuid(Buffer.from("ffffffffffff00000000000000000000", "hex"))
      const val3 = new Uuid(Buffer.from("ffffffffffff00000000000000000001", "hex"))
      assertEquals(val.equals(val), true)
      assertEquals(val.equals(new Uuid(Buffer.from("aabbccddeeff00112233445566778899", "hex"))), true)
      assertEquals(val.equals(val2), false)
      assertEquals(val.equals(val3), false)
      assertEquals(val2.equals(val3), false)
      assertEquals(val3.equals(val2), false)
    })
  })

  describe("#getBuffer()", function () {
    it("should return the Buffer representation", function () {
      let buf = Buffer.allocUnsafe(16)
      let val = new Uuid(buf)
      assertEquals(val.getBuffer().toString("hex"), buf.toString("hex"))
      buf = Buffer.from("ffffccddeeff00222233445566778813", "hex")
      val = new Uuid(buf)
      assertEquals(val.getBuffer().toString("hex"), buf.toString("hex"))
    })
  })

  describe("fromString()", function () {
    it("should validate that the string", function () {
      assertThrows(function () {
        Uuid.fromString("22")
      })
      assertThrows(function () {
        Uuid.fromString("zzb1ccdd-eeff-0011-2233-445566778800")
      })
      assertEquals(
        Uuid.fromString("acb1ccdd-eeff-0011-2233-445566778813").toString(),
        "acb1ccdd-eeff-0011-2233-445566778813",
      )
    })
    it("should contain a valid internal representation", function () {
      let val = Uuid.fromString("acb1ccdd-eeff-0011-2233-445566778813")
      assertEquals(val.getBuffer().toString("hex"), "acb1ccddeeff00112233445566778813")
      val = Uuid.fromString("ffffccdd-eeff-0022-2233-445566778813")
      assertEquals(val.getBuffer().toString("hex"), "ffffccddeeff00222233445566778813")
    })
  })

  describe("random()", function () {
    it("should return a Uuid instance", function () {
      assertEquals(Uuid.random() instanceof Uuid, true)
    })
    it("should contain the version bits and IETF variant", function () {
      let val = Uuid.random()
      assertEquals(val.toString().charAt(14), "4")
      assertEquals(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0, true)
      val = Uuid.random()
      assertEquals(val.toString().charAt(14), "4")
      assertEquals(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0, true)
      val = Uuid.random()
      assertEquals(val.toString().charAt(14), "4")
      assertEquals(["8", "9", "a", "b"].indexOf(val.toString().charAt(19)) >= 0, true)
    })
    it("should generate v4 uuids that do not collide", function () {
      const values: Record<string, boolean> = {}
      const length = 100000
      for (let i = 0; i < length; i++) {
        values[Uuid.random().toString()] = true
      }
      assertEquals(Object.keys(values).length, length)
    })
  })
})
