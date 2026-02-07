import { sum } from '~/utils/sum'

/*
Jtest run time cung cấp các hàm describe, it, expect dưới dạng global function 
nên có thể sử dụng trực tiếp mà không cần import

describe: gom các test case liên quan lại với nhau
it: mô tả 1 test case cụ thể
expect: dùng để assert (kiểm tra) giá trị mong đợi với giá trị thực tế
*/

describe('Unit test: sum():', () => {
  it('should return correct sum of two positive numbers', () => {
    expect(sum(2, 3)).toBe(5)
  })
  it('should return correct sum of a positive and a negative number', () => {
    expect(sum(5, -2)).toBe(3)
  })
})
