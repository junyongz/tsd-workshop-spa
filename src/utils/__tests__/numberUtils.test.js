import { jest, test, expect } from '@jest/globals'

import formatThousandSeparator from "../numberUtils";

test('normal numbers', () => {
    expect(formatThousandSeparator(1000)).toBe('1,000')
    expect(formatThousandSeparator(200000)).toBe('200,000')
    expect(formatThousandSeparator(10000000)).toBe('10,000,000')
    expect(formatThousandSeparator(100)).toBe('100')
    expect(formatThousandSeparator(-1000)).toBe('-1,000')
})

test('not normal numbers', () => {
    expect(formatThousandSeparator('ABC')).toBe('ABC')
    expect(formatThousandSeparator(undefined)).toBeUndefined()
    expect(formatThousandSeparator([])).toEqual([])
    expect(formatThousandSeparator({})).toEqual({})
})
