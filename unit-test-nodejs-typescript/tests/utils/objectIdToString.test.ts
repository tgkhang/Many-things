import { ObjectId } from 'mongodb'

import { objectIdToString } from '~/utils/objectIdToString'

describe('objectIdToString', () => {
  it('should return correct hex string from ObjectId', () => {
    const rawId = new ObjectId()
    const convertedId = objectIdToString(rawId)

    expect(convertedId).toBe(rawId.toHexString())
    expect(convertedId).toHaveLength(24)
    expect(convertedId).toMatch(/^[a-f0-9]{24}$/)
  })
})
