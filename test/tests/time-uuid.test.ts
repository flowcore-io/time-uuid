import { assertEquals } from "jsr:@std/assert/equals"
import { describe, it } from "jsr:@std/testing/bdd"
import { TimeUuid } from "../../src/mod.ts"
import { Buffer } from "node:buffer"

describe("TimeUuid", () => {
  describe("constructor()", () => {
    it("should generate based on the parameters", function () {
      //Gregorian calendar epoch
      let val = new TimeUuid(
        new Date(-12219292800000),
        0,
        Buffer.from([0, 0, 0, 0, 0, 0]),
        Buffer.from([0, 0]),
      )
      assertEquals(val.toString(), "00000000-0000-1000-8000-000000000000")
      val = new TimeUuid(
        new Date(-12219292800000 + 1000),
        0,
        Buffer.from([0, 0, 0, 0, 0, 0]),
        Buffer.from([0, 0]),
      )
      assertEquals(val.toString(), "00989680-0000-1000-8000-000000000000")
      //unix  epoch
      val = new TimeUuid(
        new Date(0),
        0,
        Buffer.from([0, 0, 0, 0, 0, 0]),
        Buffer.from([0, 0]),
      )
      assertEquals(val.toString(), "13814000-1dd2-11b2-8000-000000000000")
      val = new TimeUuid(
        new Date(0),
        0,
        Buffer.from([255, 255, 255, 255, 255, 255]),
        Buffer.from([255, 255]),
      )
      assertEquals(val.toString(), "13814000-1dd2-11b2-bfff-ffffffffffff")
      val = new TimeUuid(
        new Date(0),
        0,
        Buffer.from([1, 1, 1, 1, 1, 1]),
        Buffer.from([1, 1]),
      )
      assertEquals(val.toString(), "13814000-1dd2-11b2-8101-010101010101")

      val = new TimeUuid(
        new Date("2015-01-10 5:05:05 GMT+0000"),
        0,
        Buffer.from([1, 1, 1, 1, 1, 1]),
        Buffer.from([1, 1]),
      )
      assertEquals(val.toString(), "3d555680-9886-11e4-8101-010101010101")
    })
  })

  describe("#getDatePrecision()", function () {
    it("should get the Date and ticks of the Uuid representation", function () {
      let date = new Date()
      let val = new TimeUuid(date, 1)
      assertEquals(val.getDatePrecision().ticks, 1)
      assertEquals(val.getDatePrecision().date.getTime(), date.getTime())

      date = new Date("2015-02-13 06:07:08.450")
      val = new TimeUuid(date, 699)
      assertEquals(val.getDatePrecision().ticks, 699)
      assertEquals(val.getDatePrecision().date.getTime(), date.getTime())
      assertEquals(val.getDate().getTime(), date.getTime())
    })
  })

  describe("#getNodeId()", function () {
    it("should get the node id of the Uuid representation", function () {
      let val = new TimeUuid(new Date(), 0, Buffer.from([1, 2, 3, 4, 5, 6]))
      assertEquals(val.getNodeId() instanceof Buffer, true)
      assertEquals(val.getNodeId().toString("hex"), "010203040506")
      val = new TimeUuid(new Date(), 0, "host01")
      assertEquals(val.getNodeIdString(), "host01")
      val = new TimeUuid(new Date(), 0, "h12288")
      assertEquals(val.getNodeIdString(), "h12288")
    })
  })

  describe("fromDate()", function () {
    it("should generate v1 uuids that do not collide", function () {
      const values: Record<string, boolean> = {}
      const length = 50000
      const date = new Date()
      for (let i = 0; i < length; i++) {
        values[TimeUuid.fromDate(date).toString()] = true
      }
      assertEquals(Object.keys(values).length, length)
    })
    it("should collide exactly at 10001 if date but not the ticks are specified", function () {
      const values: Record<string, boolean> = {}
      const length = 10000
      const date = new Date()
      for (let i = 0; i < length; i++) {
        values[TimeUuid.fromDate(date, undefined, "host01", "AA").toString()] = true
      }
      assertEquals(Object.keys(values).length, length)
      //next should collide
      assertEquals(values[TimeUuid.fromDate(date, undefined, "host01", "AA").toString()], true)
    })
  })

  describe("fromString()", function () {
    it("should parse the string representation", function () {
      const text = "3d555680-9886-11e4-8101-010101010101"
      const val = TimeUuid.fromString(text)
      assertEquals(val instanceof TimeUuid, true)
      assertEquals(val.toString(), text)
      assertEquals(val.getDate().getTime(), new Date("2015-01-10 5:05:05 GMT+0000").getTime())
    })
  })

  describe("now()", function () {
    it("should pass the nodeId when provided", function () {
      const val = TimeUuid.now("h12345")
      assertEquals(val.getNodeIdString(), "h12345")
    })
    it("should use current date", function () {
      const startDate = new Date().getTime()
      const val = TimeUuid.now().getDate().getTime()
      const endDate = new Date().getTime()
      assertEquals(val >= startDate, true)
      assertEquals(val <= endDate, true)
    })
    it("should reset the ticks portion of the TimeUuid to zero when the time progresses", function () {
      const firstTimeUuid = TimeUuid.now()
      let secondTimeUuid = TimeUuid.now()
      while (firstTimeUuid.getDate().getTime() === secondTimeUuid.getDate().getTime()) {
        secondTimeUuid = TimeUuid.now()
      }
      assertEquals(secondTimeUuid.getDatePrecision().ticks, 0)
    })
  })

  describe("min()", function () {
    it("should generate uuid with the minimum node and clock id values", function () {
      const val = TimeUuid.min(new Date())
      assertEquals(val.getNodeId().toString("hex"), "808080808080")
    })
  })

  describe("max()", function () {
    it("should generate uuid with the maximum node and clock id values", function () {
      const val = TimeUuid.max(new Date())
      assertEquals(val.getNodeId().toString("hex"), "7f7f7f7f7f7f")
    })
  })
})
