import { mapOrder } from '~/utils/mapOrder'

describe('Unit test: mapOrder():', () => {
  it('should return [] when originalArray is null', () => {
    expect(mapOrder(null as any, [1, 2, 3], 'id')).toEqual([])
  })
  it('should return [] when orderArray is null', () => {
    expect(mapOrder([{ id: 1 }], null as any, 'id')).toEqual([])
  })
  it('should return [] when key is null', () => {
    expect(mapOrder([{ id: 1 }], [1, 2, 3], null as any)).toEqual([])
  })
  it('should return ordered array based on orderArray', () => {
    const originalArray = [
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    const orderArray = [2, 3, 1]
    const result = mapOrder(originalArray, orderArray, 'id')
    expect(result).toEqual([
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
    ])
  })
})
