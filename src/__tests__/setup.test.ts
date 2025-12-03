import { describe, it, expect } from '@jest/globals'
import * as fc from 'fast-check'

describe('Testing Framework Setup', () => {
  it('should run basic Jest tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should run fast-check property tests', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a
      }),
      { numRuns: 100 }
    )
  })
})
