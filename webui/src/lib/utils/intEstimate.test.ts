import { describe, expect, it } from 'vitest'
import { formatIntEstimate } from './intEstimate'

describe('formatIntEstimate', () => {
  it('formats an exact number without a tilde', () => {
    expect(formatIntEstimate(1234, 'en', false)).toBe('1,234')
  })

  it('rounds an estimate to the given significant figures and prefixes a tilde', () => {
    expect(formatIntEstimate(1234, 'en', true, 2)).toBe('~1,200')
  })

  it('leaves zero untouched even when marked as an estimate', () => {
    expect(formatIntEstimate(0, 'en', true)).toBe('~0')
  })
})
