import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest', // ts-jest để biên dịch TypeScript khi chạy test.
  testEnvironment: 'jsdom', // Mặc định Jest chạy trong môi trường Node.js, nhưng React component cần DOM API (như document, window, HTML Element...). Nên chúng ta cần jsdom giả lập trình duyệt trong Node, giúp test React component.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Declare file jest.setup.ts, will run after Jest initializes the test environment (ENV).
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1', // $1 means the rest after './src/...'
  }, // ánh xạ alias khi import module. Cannot find module '~/...' khi chạy test
}

export default config
