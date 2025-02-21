import { assertEquals } from "jsr:@std/assert"
import { describe, it } from "jsr:@std/testing/bdd"
import { Buffer } from "node:buffer"
import { TimeUuid } from "../../src/mod.ts"

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

  describe("#getDatePrecision()", () => {
    it("should get the Date and ticks of the Uuid representation", () => {
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

  describe("#getNodeId()", () => {
    it("should get the node id of the Uuid representation", () => {
      let val = new TimeUuid(new Date(), 0, Buffer.from([1, 2, 3, 4, 5, 6]))
      assertEquals(val.getNodeId() instanceof Buffer, true)
      assertEquals(val.getNodeId().toString("hex"), "010203040506")
      val = new TimeUuid(new Date(), 0, "host01")
      assertEquals(val.getNodeIdString(), "host01")
      val = new TimeUuid(new Date(), 0, "h12288")
      assertEquals(val.getNodeIdString(), "h12288")
    })
  })

  describe("#getBefore()", () => {
    it("should get the before value of the Uuid representation", function () {
      let val = new TimeUuid(new Date(), 1, "host01", "AA")
      let valBefore = val.getBefore()

      assertEquals(val.getDatePrecision().date.getTime(), valBefore.getDatePrecision().date.getTime())
      assertEquals(val.getDatePrecision().ticks, 1)
      assertEquals(valBefore.getDatePrecision().ticks, 0)

      val = new TimeUuid(new Date(), 0, "host01", "AA")
      valBefore = val.getBefore()
      assertEquals(val.getDatePrecision().date.getTime() - 1, valBefore.getDatePrecision().date.getTime())
      assertEquals(val.getDatePrecision().ticks, 0)
      assertEquals(valBefore.getDatePrecision().ticks, 9999)
    })
  })

  describe("#isBefore()", () => {
    it("should return true if the first uuid is before the second", () => {
      const val1 = new TimeUuid(new Date(2020, 0, 1, 0, 0, 0, 0))
      const val2 = new TimeUuid(new Date(2020, 0, 1, 0, 0, 0, 1))
      assertEquals(val1.isBefore(val2), true)
      assertEquals(val2.isBefore(val1), false)
    })
  })

  describe("#isAfter()", () => {
    it("should return true if the first uuid is after the second", () => {
      const val1 = new TimeUuid(new Date(2020, 0, 1, 0, 0, 0, 0))
      const val2 = new TimeUuid(new Date(2020, 0, 1, 0, 0, 0, 1))
      assertEquals(val1.isAfter(val2), false)
      assertEquals(val2.isAfter(val1), true)
    })
  })

  describe("fromDate()", () => {
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

  describe("fromString()", () => {
    it("should parse the string representation", function () {
      const text = "3d555680-9886-11e4-8101-010101010101"
      const val = TimeUuid.fromString(text)
      assertEquals(val instanceof TimeUuid, true)
      assertEquals(val.toString(), text)
      assertEquals(val.getDate().getTime(), new Date("2015-01-10 5:05:05 GMT+0000").getTime())
    })
  })

  describe("now()", () => {
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

  describe("min()", () => {
    it("should generate uuid with the minimum node and clock id values", function () {
      const val = TimeUuid.min(new Date())
      assertEquals(val.getNodeId().toString("hex"), "808080808080")
    })
  })

  describe("max()", () => {
    it("should generate uuid with the maximum node and clock id values", function () {
      const val = TimeUuid.max(new Date())
      assertEquals(val.getNodeId().toString("hex"), "7f7f7f7f7f7f")
    })
  })

  describe("sortAscending()", () => {
    const timeUuids = [
      { expectedOrder: 2, id: TimeUuid.fromDate(new Date(2020, 0, 2, 0, 0, 0, 0), 2).toString() },
      { expectedOrder: 1, id: TimeUuid.fromDate(new Date(2020, 0, 2, 0, 0, 0, 0), 1).toString() },
      { expectedOrder: 0, id: TimeUuid.fromDate(new Date(2020, 0, 1, 0, 0, 0, 0)).toString() },
      { expectedOrder: 3, id: TimeUuid.fromDate(new Date(2020, 0, 3, 0, 0, 0, 0)).toString() },
    ]

    it("should sort the timeUuids in ascending order", () => {
      const sorted = structuredClone(timeUuids).sort((a, b) =>
        TimeUuid.sortAscending(TimeUuid.fromString(a.id), TimeUuid.fromString(b.id))
      )
      assertEquals(sorted[0].expectedOrder, 0)
      assertEquals(sorted[1].expectedOrder, 1)
      assertEquals(sorted[2].expectedOrder, 2)
      assertEquals(sorted[3].expectedOrder, 3)
    })

    it("should sort the timeUuids in descending order", () => {
      const sorted = structuredClone(timeUuids).sort((a, b) =>
        TimeUuid.sortDescending(TimeUuid.fromString(a.id), TimeUuid.fromString(b.id))
      )
      assertEquals(sorted[0].expectedOrder, 3)
      assertEquals(sorted[1].expectedOrder, 2)
      assertEquals(sorted[2].expectedOrder, 1)
      assertEquals(sorted[3].expectedOrder, 0)
    })
  })
})
