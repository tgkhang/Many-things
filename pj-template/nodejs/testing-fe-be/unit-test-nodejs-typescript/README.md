# Node.js Backend Testing Practice

A practice project for learning and mastering unit testing in Node.js backend applications using TypeScript, Express, and Jest.

## Overview

This project implements a RESTful API with a complete testing suite, demonstrating testing patterns for different layers of a backend application. The focus is on learning how to write effective tests for controllers, services, repositories, middleware, utilities, and validation logic.

## Tech Stack

- **Runtime**: Node.js 22+
- **Language**: TypeScript
- **Framework**: Express 5
- **Database**: MongoDB
- **Testing Framework**: Jest
- **Testing Utilities**: Supertest (for HTTP testing)
- **Validation**: Zod
- **Authentication**: bcryptjs for password hashing

## Project Structure

```text
.
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration modules (CORS, DB, env, logger)
│   ├── core/                  # Core utilities and middleware
│   │   ├── asyncHandler.ts    # Async error handler wrapper
│   │   ├── auth/              # Authentication utilities
│   │   ├── http/              # HTTP error handling & API errors
│   │   ├── mail/              # Email client
│   │   └── validate/          # Request validation middleware
│   ├── modules/               # Feature modules
│   │   └── users/             # User module (controller, service, repo, routes, validation)
│   └── utils/                 # Utility functions
└── tests/                     # Test files (mirrors src structure)
    ├── config/
    ├── core/
    ├── modules/
    └── utils/
```

## Testing Coverage

The project includes comprehensive tests for:

### Configuration Tests

- [cors.test.ts](tests/config/cors.test.ts) - CORS configuration testing
- [db.test.ts](tests/config/db.test.ts) - Database connection testing

### Core Functionality Tests

- [asyncHandler.test.ts](tests/core/asyncHandler.test.ts) - Async error handler middleware
- [ApiError.test.ts](tests/core/http/ApiError.test.ts) - Custom API error classes
- [errorHandler.test.ts](tests/core/http/errorHandler.test.ts) - Error handling middleware
- [validateRequest.test.ts](tests/core/validate/validateRequest.test.ts) - Request validation middleware

### Module Tests (User Module Example)

- [user.controller.test.ts](tests/modules/users/user.controller.test.ts) - Controller layer testing with mocks
- [user.service.test.ts](tests/modules/users/user.service.test.ts) - Service layer business logic
- [user.repo.test.ts](tests/modules/users/user.repo.test.ts) - Repository/database layer
- [user.routes.test.ts](tests/modules/users/user.routes.test.ts) - Route integration testing
- [user.validation.test.ts](tests/modules/users/user.validation.test.ts) - Zod schema validation

### Utility Tests

- [password.test.ts](tests/utils/password.test.ts) - Password hashing utilities
- [objectIdToString.test.ts](tests/utils/objectIdToString.test.ts) - MongoDB ObjectId conversions

### Application Tests

- [app.test.ts](tests/app.test.ts) - Express app initialization and middleware setup

## Testing Patterns Demonstrated

### 1. Controller Testing

Testing HTTP request/response handling with mocked services:

```typescript
// Mock dependencies
jest.mock('~/modules/users/user.service')

// Mock Express Response
const mockResponse = () => {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Test controller method
it('should return user data', async () => {
  const req = { body: { email: 'test@test.com' } } as Request
  const res = mockResponse()

  await UserController.register(req, res)

  expect(res.status).toHaveBeenCalledWith(201)
})
```

### 2. Service Layer Testing

Testing business logic by mocking repositories

### 3. Repository Testing

Testing database operations with MongoDB mocks

### 4. Route Testing

Integration testing with Supertest for full HTTP request/response cycle

### 5. Middleware Testing

Testing Express middleware functions for validation, error handling, and async operations

### 6. Validation Testing

Testing Zod schemas for request validation

## Getting Started

### Prerequisites

- Node.js 22 or higher
- MongoDB (local or cloud)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your-database
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Setup database indexes
npm run db:setup-indexes
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Learning Objectives

This project helps you learn:

1. **Test Structure**: How to organize tests to mirror application structure
2. **Mocking**: How to mock dependencies (services, repositories, external APIs)
3. **Unit Testing**: Testing individual functions and methods in isolation
4. **Integration Testing**: Testing API endpoints with Supertest
5. **Test-Driven Development**: Writing tests alongside or before implementation
6. **Code Coverage**: Understanding and achieving good test coverage
7. **TypeScript Testing**: Handling types in test files
8. **Async Testing**: Testing async/await functions and promises
9. **Error Testing**: Testing error scenarios and edge cases
10. **Middleware Testing**: Testing Express middleware functions

## Test Commands Reference

| Command                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm test`             | Run all tests once                                  |
| `npm run test:watch`   | Run tests in watch mode (re-runs on file changes)   |
| `npm run test:ci`      | Run tests with coverage report (for CI/CD)          |

## Key Dependencies for Testing

- **jest**: Testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **@types/jest**: TypeScript definitions for Jest
- **supertest**: HTTP assertion library for testing Express routes
- **@types/supertest**: TypeScript definitions for Supertest

## Next Steps

To practice testing, try:

1. Add new endpoints and write tests first (TDD approach)
2. Improve test coverage in existing modules
3. Add integration tests for complex user flows
4. Practice different mocking strategies
5. Add tests for edge cases and error scenarios
6. Experiment with test organization patterns
