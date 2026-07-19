import { describe, expect, it } from 'vitest'
import { normalizeTagInput } from './normalizeTagInput'

describe('normalizeTagInput', () => {
  it('lowercases and replaces invalid characters with dashes', () => {
    expect(normalizeTagInput('Hello World!')).toBe('hello-world-')
  })

  it('strips leading dashes', () => {
    expect(normalizeTagInput('--foo')).toBe('foo')
  })

  it('collapses repeated dashes', () => {
    expect(normalizeTagInput('a---b')).toBe('a-b')
  })
})
