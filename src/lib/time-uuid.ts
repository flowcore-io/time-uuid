/*
 * Copyright DataStax, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict"

import * as crypto from "node:crypto"
import Long from "long"
import { Buffer } from "node:buffer"

import { Uuid } from "./uuid.ts"

/**
 * Date with ticks
 */
interface DatePrecision {
  date: Date
  ticks: number
}

/**
 * Time with ticks
 */
interface TimeWithTicks {
  time: number
  ticks: number
}

/** @module types */
/**
 * Oct 15, 1582 in milliseconds since unix epoch
 * @const
 * @private
 */
const _unixToGregorian = 12219292800000
/**
 * 10,000 ticks in a millisecond
 * @const
 * @private
 */
const _ticksInMs = 10000

const minNodeId: Buffer = Buffer.from("808080808080", "hex")
const minClockId: Buffer = Buffer.from("8080", "hex")
const maxNodeId: Buffer = Buffer.from("7f7f7f7f7f7f", "hex")
const maxClockId: Buffer = Buffer.from("7f7f", "hex")

/**
 * Counter used to generate up to 10000 different timeuuid values with the same Date
 * @private
 */
let _ticks = 0
/**
 * Counter used to generate ticks for the current time
 * @private
 */
let _ticksForCurrentTime = 0
/**
 * Remember the last time when a ticks for the current time so that it can be reset
 * @private
 */
let _lastTimestamp = 0

/**
 * Creates a new instance of Uuid based on the parameters provided according to rfc4122.
 * If any of the arguments is not provided, it will be randomly generated, except for the date that will use the current
 * date.
 * <p>
 *   Note that when nodeId and/or clockId portions are not provided, the constructor will generate them using
 *   <code>crypto.randomBytes()</code>. As it's possible that <code>crypto.randomBytes()</code> might block, it's
 *   recommended that you use the callback-based version of the static methods <code>fromDate()</code> or
 *   <code>now()</code> in that case.
 * </p>
 * @class
 * @classdesc Represents an immutable version 1 universally unique identifier (UUID). A UUID represents a 128-bit value.
 * <p>Usage: <code>TimeUuid.now()</code></p>
 * @param {Date|Buffer} [value] The datetime or buffer for the instance, if not provided, it will use the current Date.
 * @param {Number} [ticks] A number from 0 to 10000 representing the 100-nanoseconds units for this instance to fill in the information not available in the Date,
 * as Ecmascript Dates have only milliseconds precision.
 * @param {String|Buffer} [nodeId] A 6-length Buffer or string of 6 ascii characters representing the node identifier, ie: 'host01'.
 * @param {String|Buffer} [clockId] A 2-length Buffer or string of 6 ascii characters representing the clock identifier.
 * @constructor
 */
export class TimeUuid extends Uuid {
  /**
   * Creates a new instance of TimeUuid based on the parameters provided according to rfc4122.
   */
  constructor(
    value?: Date | Buffer,
    ticks?: number,
    nodeId?: string | Buffer,
    clockId?: string | Buffer,
  ) {
    let buffer: Buffer
    if (value instanceof Buffer) {
      if (value.length !== 16) {
        throw new Error("Buffer for v1 uuid not valid")
      }
      buffer = value
    } else {
      buffer = generateBuffer(value, ticks, nodeId, clockId)
    }
    super(buffer)
  }

  /**
   * Creates a new instance of TimeUuid based on the date provided.
   * @param {Date} date The date to create the TimeUuid from.
   * @param {Number} [ticks] A number from 0 to 10000 representing the 100-nanoseconds units for this instance to fill in the information not available in the Date,
   * as Ecmascript Dates have only milliseconds precision.
   * @param {String|Buffer} [nodeId] A 6-length Buffer or string of 6 ascii characters representing the node identifier, ie: 'host01'.
   * @param {String|Buffer} [clockId] A 2-length Buffer or string of 6 ascii characters representing the clock identifier.
   */
  static fromDate(
    date?: Date,
    ticks?: number,
    nodeId?: string | Buffer,
    clockId?: string | Buffer,
  ): TimeUuid {
    return new TimeUuid(date, ticks, nodeId, clockId)
  }

  /**
   * Creates a new instance of TimeUuid based on the string provided.
   * @param {string} value The string to create the TimeUuid from.
   */
  static override fromString(value: string): TimeUuid {
    return new TimeUuid(Uuid.fromString(value).getBuffer())
  }

  /**
   * Returns the smaller possible type 1 uuid with the provided Date.
   */
  static min(date: Date, ticks?: number): TimeUuid {
    return new TimeUuid(date, ticks, minNodeId, minClockId)
  }

  /**
   * Returns the biggest possible type 1 uuid with the provided Date.
   */
  static max(date: Date, ticks?: number): TimeUuid {
    return new TimeUuid(date, ticks, maxNodeId, maxClockId)
  }

  /**
   * Returns the current timeuuid.
   */
  static now(
    nodeId?: string | Buffer,
    clockId?: string | Buffer,
  ): TimeUuid {
    return TimeUuid.fromDate(undefined, undefined, nodeId, clockId)
  }

  /**
   * Returns the date precision (date and ticks) of the uuid.
   */
  getDatePrecision(): DatePrecision {
    const timeLow = this.buffer.readUInt32BE(0)

    let timeHigh = 0
    timeHigh |= (this.buffer[4] & 0xff) << 8
    timeHigh |= this.buffer[5] & 0xff
    timeHigh |= (this.buffer[6] & 0x0f) << 24
    timeHigh |= (this.buffer[7] & 0xff) << 16

    const val = Long.fromBits(timeLow, timeHigh)
    const ticksInMsLong = Long.fromNumber(_ticksInMs)
    const ticks = val.modulo(ticksInMsLong)
    const time = val
      .div(ticksInMsLong)
      .subtract(Long.fromNumber(_unixToGregorian))

    return {
      date: new Date(time.toNumber()),
      ticks: ticks.toNumber(),
    }
  }

  /**
   * Returns the date of the uuid.
   */
  getDate(): Date {
    return this.getDatePrecision().date
  }

  /**
   * Returns the node id of the uuid.
   */
  getNodeId(): Buffer {
    return this.buffer.subarray(10)
  }

  /**
   * Returns the clock id of the uuid.
   */
  getClockId(): Buffer {
    return this.buffer.subarray(8, 10)
  }

  /**
   * Returns the node id of the uuid as a string.
   */
  getNodeIdString(): string {
    return this.buffer.subarray(10).toString("ascii")
  }

  /**
   * Returns a timeUuid with the same date and clock id but with the ticks decremented by 1.
   */
  getBefore(): TimeUuid {
    const { date: beforeDate, ticks } = this.getDatePrecision()
    return TimeUuid.fromDate(beforeDate, ticks - 1, this.getNodeId(), this.getClockId())
  }
}

// Helper functions
function writeTime(buffer: Buffer, time: number, ticks: number): void {
  const val = Long
    .fromNumber(time + _unixToGregorian)
    .multiply(Long.fromNumber(10000))
    .add(Long.fromNumber(ticks))
  const timeHigh = val.getHighBitsUnsigned()
  buffer.writeUInt32BE(val.getLowBitsUnsigned(), 0)
  buffer.writeUInt16BE(timeHigh & 0xffff, 4)
  buffer.writeUInt16BE(timeHigh >>> 16 & 0xffff, 6)
}

function getClockId(clockId?: string | Buffer): Buffer {
  let buffer = clockId
  if (typeof clockId === "string") {
    buffer = Buffer.from(clockId, "ascii")
  }
  if (!(buffer instanceof Buffer)) {
    buffer = getRandomBytes(2)
  } else if (buffer.length !== 2) {
    throw new Error("Clock identifier must have 2 bytes")
  }
  return buffer
}

function getNodeId(nodeId?: string | Buffer): Buffer {
  let buffer = nodeId
  if (typeof nodeId === "string") {
    buffer = Buffer.from(nodeId, "ascii")
  }
  if (!(buffer instanceof Buffer)) {
    buffer = getRandomBytes(6)
  } else if (buffer.length !== 6) {
    throw new Error("Node identifier must have 6 bytes")
  }
  return buffer
}

function getTicks(ticks?: number): number {
  if (typeof ticks !== "number" || ticks >= _ticksInMs) {
    _ticks++
    if (_ticks >= _ticksInMs) {
      _ticks = 0
    }
    ticks = _ticks
  }
  return ticks
}

function getTimeWithTicks(date?: Date, ticks?: number): TimeWithTicks {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date()
    const time = date.getTime()
    _ticksForCurrentTime++
    if (_ticksForCurrentTime > _ticksInMs || time > _lastTimestamp) {
      _ticksForCurrentTime = 0
      _lastTimestamp = time
    }
    ticks = _ticksForCurrentTime
  }
  return {
    time: date.getTime(),
    ticks: getTicks(ticks),
  }
}

function getRandomBytes(length: number): Buffer {
  return crypto.randomBytes(length)
}

function generateBuffer(
  date?: Date | Buffer,
  ticks?: number,
  nodeId?: string | Buffer,
  clockId?: string | Buffer,
): Buffer {
  const timeWithTicks = getTimeWithTicks(date as Date, ticks)
  const nodeBuffer = getNodeId(nodeId)
  const clockBuffer = getClockId(clockId)
  const buffer = Buffer.alloc(16)

  writeTime(buffer, timeWithTicks.time, timeWithTicks.ticks)
  clockBuffer.copy(buffer, 8, 0)
  nodeBuffer.copy(buffer, 10, 0)

  // Version Byte: Time based
  buffer[6] = buffer[6] & 0x0f
  buffer[6] = buffer[6] | 0x10

  // IETF Variant Byte
  buffer[8] = buffer[8] & 0x3f
  buffer[8] = buffer[8] | 0x80

  return buffer
}
