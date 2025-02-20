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
import { Buffer } from "node:buffer"

/** @module types */

/**
 * Represents an immutable universally unique identifier (UUID).
 * A UUID represents a 128-bit value.
 */
export class Uuid {
  protected buffer: Buffer

  /**
   * Creates a new instance of Uuid based on a Buffer
   * @param buffer The 16-length buffer.
   */
  constructor(buffer: Buffer) {
    if (!buffer || buffer.length !== 16) {
      throw new Error("You must provide a buffer containing 16 bytes")
    }
    this.buffer = buffer
  }

  /**
   * Parses a string representation of a Uuid
   * @param value The string representation of UUID
   * @returns A new Uuid instance
   */
  static fromString(value: string): Uuid {
    //36 chars: 32 + 4 hyphens
    if (typeof value !== "string" || value.length !== 36) {
      throw new Error("Invalid string representation of Uuid, it should be in the 00000000-0000-0000-0000-000000000000")
    }
    return new Uuid(Buffer.from(value.replace(/-/g, ""), "hex"))
  }

  /**
   * Creates a new random (version 4) Uuid.
   */
  static random(): Uuid {
    const buffer = getRandomBytes()
    return createUuidFromBuffer(buffer!)
  }

  /**
   * Gets the bytes representation of a Uuid
   * @returns The buffer containing the bytes
   */
  getBuffer(): Buffer {
    return this.buffer
  }

  /**
   * Compares this object to the specified object.
   * The result is true if and only if the argument is not null, is a UUID object,
   * and contains the same value, bit for bit, as this UUID.
   * @param other The other value to test for equality.
   */
  equals(other: Uuid): boolean {
    return other instanceof Uuid && this.buffer.equals(other.buffer)
  }

  /**
   * Returns a string representation of the value of this Uuid instance.
   * 32 hex separated by hyphens, in the form of 00000000-0000-0000-0000-000000000000.
   */
  toString(): string {
    //32 hex representation of the Buffer
    const hexValue = getHex(this)
    return (
      hexValue.substr(0, 8) + "-" +
      hexValue.substr(8, 4) + "-" +
      hexValue.substr(12, 4) + "-" +
      hexValue.substr(16, 4) + "-" +
      hexValue.substr(20, 12)
    )
  }

  /**
   * Provide the name of the constructor and the string representation
   */
  inspect(): string {
    return this.constructor.name + ": " + this.toString()
  }

  /**
   * Returns the string representation.
   * Method used by the native JSON.stringify() to serialize this instance.
   */
  toJSON(): string {
    return this.toString()
  }
}

/**
 * Returns new Uuid
 * @private
 */
function createUuidFromBuffer(buffer: Buffer): Uuid {
  //clear the version
  buffer[6] &= 0x0f
  //set the version 4
  buffer[6] |= 0x40
  //clear the variant
  buffer[8] &= 0x3f
  //set the IETF variant
  buffer[8] |= 0x80
  return new Uuid(buffer)
}

/**
 * @private
 * @returns 32 hex representation of the instance, without separators
 */
function getHex(uuid: Uuid): string {
  return uuid.getBuffer().toString("hex")
}

/**
 * Gets a crypto generated 16 bytes
 * @private
 */
function getRandomBytes(): Buffer {
  return crypto.randomBytes(16)
}
