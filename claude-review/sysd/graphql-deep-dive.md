# 🔷 GraphQL — Deep Dive
>
> Schema-first API · Resolver Mechanism · N+1 · Federation · Performance

---

## 📚 Mục Lục

1. [Tại Sao GraphQL Ra Đời?](#1-tại-sao-graphql-ra-đời)
2. [Type System & Schema](#2-type-system--schema)
3. [Query, Mutation, Subscription](#3-query-mutation-subscription)
4. [Resolver — Cơ Chế Bên Trong](#4-resolver--cơ-chế-bên-trong)
5. [N+1 Problem Trong GraphQL & DataLoader](#5-n1-problem-trong-graphql--dataloader)
6. [GraphQL vs REST — So Sánh Thực Tế](#6-graphql-vs-rest--so-sánh-thực-tế)
7. [Error Handling](#7-error-handling)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Apollo Federation — Micro-service GraphQL](#9-apollo-federation--micro-service-graphql)
10. [Performance & Security](#10-performance--security)
11. [Spring Boot + GraphQL](#11-spring-boot--graphql)

---

# 1. Tại Sao GraphQL Ra Đời?

## 1.1 Vấn Đề Facebook Gặp Phải (2012)

```
Facebook mobile app (2012):
  - News Feed cần data từ: posts, users, likes, comments, media, ads
  - Mobile network: chậm, bandwidth giới hạn
  - REST approach: nhiều endpoints → nhiều round-trips

Vấn đề cụ thể:

OVER-FETCHING:
  GET /users/1
  → { id, name, email, phone, address, bio, avatar,
      createdAt, updatedAt, preferences, ... }
  Mobile chỉ cần: id, name, avatar
  → Download data không cần thiết → waste bandwidth

UNDER-FETCHING (N+1 at API level):
  GET /users/1          → user data
  GET /users/1/posts    → post list
  GET /users/1/friends  → friend list
  GET /posts/10/comments → comments
  → 4 round-trips để render 1 screen!

VERSIONING NIGHTMARE:
  /api/v1/users → mobile app v1
  /api/v2/users → mobile app v2 (different fields)
  /api/v3/users → web app
  → 3 endpoints cho cùng resource, maintenance burden

Facebook giải pháp: GraphQL (2015 public release)
  Client nói chính xác data nào cần
  Server trả đúng data đó, không hơn không kém
  1 round-trip cho tất cả data cần thiết
```

## 1.2 GraphQL Là Gì Về Bản Chất?

```
GraphQL KHÔNG phải:
  ❌ Database query language (không liên quan đến SQL)
  ❌ REST replacement bắt buộc (có thể coexist)
  ❌ Framework (chỉ là specification)

GraphQL LÀ:
  ✅ Query language cho API (client mô tả data structure cần)
  ✅ Runtime để execute queries (server resolves từng field)
  ✅ Strongly typed schema (contract giữa client và server)
  ✅ Single endpoint (thường POST /graphql)

Core idea:
  Thay vì server quyết định data shape → CLIENT quyết định
  
  REST:   Server → "đây là User object"
  GraphQL: Client → "tôi cần user.name và user.posts[].title"
           Server → trả chính xác cấu trúc client mô tả
```

---

# 2. Type System & Schema

## 2.1 Schema Definition Language (SDL)

```graphql
# Schema là CONTRACT giữa client và server.
# Strongly typed: mọi field phải có type rõ ràng.

# Scalar types (built-in):
# Int, Float, String, Boolean, ID

# Custom scalar:
scalar DateTime
scalar Upload
scalar JSON

# Object type:
type User {
  id: ID!          # ! = Non-nullable (required)
  name: String!
  email: String!
  avatar: String   # nullable (optional)
  age: Int
  role: UserRole!  # Enum
  createdAt: DateTime!

  # Field với arguments:
  posts(
    first: Int = 10
    after: String    # cursor pagination
    status: PostStatus
  ): PostConnection!

  friends: [User!]!  # Non-null list of non-null Users
}

# Enum:
enum UserRole {
  ADMIN
  USER
  MODERATOR
}

# Interface:
interface Node {
  id: ID!  # All types implementing Node have id
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  author: User!
  tags: [String!]!
  publishedAt: DateTime
}

# Union type:
union SearchResult = User | Post | Product

# Input type (cho mutations):
input CreatePostInput {
  title: String!
  content: String!
  tags: [String!]
}

# Connection pattern (pagination):
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Root types:
type Query {
  user(id: ID!): User
  users(filter: UserFilter, first: Int, after: String): UserConnection!
  me: User           # current authenticated user
  search(query: String!): [SearchResult!]!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
}

type Subscription {
  postCreated(authorId: ID): Post!
  commentAdded(postId: ID!): Comment!
}
```

## 2.2 Nullability — Thiết Kế Quan Trọng

```graphql
# GraphQL nullable by default. ! = non-null.
# Thiết kế nullability ảnh hưởng client error handling!

type User {
  id: ID!          # Non-null: luôn có id (nếu user tồn tại)
  name: String!    # Non-null: user luôn có name
  phone: String    # Nullable: user có thể chưa có phone

  # Nested: null propagation!
  address: Address        # nullable: user có thể chưa có address
  address: Address!       # non-null: khi null → GraphQL error propagates UP!
}

# NULL PROPAGATION:
# Nếu field non-null resolve ra null → error propagates to nearest nullable parent
# GraphQL "nulls out" parent + trả errors array

type Order {
  id: ID!
  user: User!         # non-null
  # If user resolver returns null → error propagates
  # → order itself bị null trong response
  # → errors array có entry cho order.user
}

# Design guideline:
# Required business data: non-null (!)
# Optional data: nullable
# Lists: [User!]! = non-null list of non-null users (most common)
#        [User]   = nullable list of nullable users (rare)
#        [User!]  = nullable list of non-null users
```

---

# 3. Query, Mutation, Subscription

## 3.1 Query — Đọc Dữ Liệu

```graphql
# Client gửi query:
query GetUserProfile($userId: ID!) {
  user(id: $userId) {
    id
    name
    avatar
    posts(first: 5, status: PUBLISHED) {
      edges {
        node {
          id
          title
          publishedAt
          tags
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}

# Variables (gửi separately, not inline):
{
  "userId": "user_123"
}

# FRAGMENTS: tái sử dụng field selections
fragment UserBasic on User {
  id
  name
  avatar
}

query GetFeed {
  me {
    ...UserBasic   # spread fragment
    friends {
      ...UserBasic # reuse!
    }
  }
}

# INLINE FRAGMENTS: cho union/interface types
query Search($q: String!) {
  search(query: $q) {
    ... on User {
      name
      email
    }
    ... on Post {
      title
      author { name }
    }
    ... on Product {
      name
      price
    }
  }
}

# DIRECTIVES: conditional fields
query GetUser($includeEmail: Boolean!, $skipPhone: Boolean!) {
  user(id: "1") {
    name
    email @include(if: $includeEmail)   # chỉ include nếu true
    phone @skip(if: $skipPhone)          # skip nếu true
  }
}
```

## 3.2 Mutation — Thay Đổi Dữ Liệu

```graphql
# Mutations là sequential (không parallel như Query fields)!
# Đảm bảo: create trước → use created id → no race condition

mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      id
      name
    }
    createdAt
  }
}

# Variables:
{
  "input": {
    "title": "GraphQL Deep Dive",
    "content": "...",
    "tags": ["graphql", "api"]
  }
}

# Multiple mutations in one request (SEQUENTIAL):
mutation {
  post1: createPost(input: { title: "Post 1", content: "..." }) { id }
  post2: createPost(input: { title: "Post 2", content: "..." }) { id }
}
# post1 completes FIRST, then post2
# (vs Query fields: parallel by default)

# Error trong mutation: hai cách
# 1. GraphQL errors (top-level errors array)
# 2. Union result type (recommended):
type CreatePostResult {
  post: Post
  errors: [UserError!]!
}

type UserError {
  field: String
  message: String!
  code: String!
}

type Mutation {
  createPost(input: CreatePostInput!): CreatePostResult!
}
```

## 3.3 Subscription — Real-time

```graphql
# Subscriptions: long-lived connection (WebSocket)
subscription OnCommentAdded($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    content
    author {
      name
      avatar
    }
    createdAt
  }
}
```

```javascript
// Apollo Client subscription setup:
import { split, HttpLink } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const httpLink = new HttpLink({ uri: "https://api.example.com/graphql" });

const wsLink = new GraphQLWsLink(createClient({
  url: "wss://api.example.com/graphql",
  connectionParams: { authToken: getToken() },
}));

// Route: queries/mutations → HTTP, subscriptions → WebSocket
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === "OperationDefinition" && def.operation === "subscription";
  },
  wsLink,
  httpLink
);

// In component:
const { data, loading } = useSubscription(ON_COMMENT_ADDED, {
  variables: { postId: "post_123" },
});
```

---

# 4. Resolver — Cơ Chế Bên Trong

## 4.1 GraphQL Execution — Từng Bước

```
Khi server nhận GraphQL request:

1. PARSE: query string → AST (Abstract Syntax Tree)
   "query { user(id: "1") { name posts { title } } }"
   → Document { Query { Field("user") { Field("name"), Field("posts") { Field("title") } } } }

2. VALIDATE: AST check against schema
   - Field "user" có tồn tại trong Query type không?
   - "name" có trong User type không?
   - Arguments đúng type không?
   → Nếu invalid: trả errors, không execute

3. EXECUTE: traverse AST, call resolvers
   GraphQL traverses field by field, top-down:
   
   Query.user(id: "1")           → Resolver chạy → User object
     User.name                   → Resolver chạy → "Khang"
     User.posts                  → Resolver chạy → [Post, Post, Post]
       Post[0].title             → Resolver chạy → "Post 1"
       Post[1].title             → Resolver chạy → "Post 2"
       Post[2].title             → Resolver chạy → "Post 3"
   
4. SERIALIZE: kết quả → JSON response theo shape của query
```

## 4.2 Resolver Function — Cấu Trúc

```javascript
// Resolver function nhận 4 arguments:
// (parent, args, context, info)

const resolvers = {
  Query: {
    // parent = undefined (root query)
    // args = { id: "user_123" }
    // context = { db, currentUser, loaders }
    // info = execution info (field, returnType, path)
    user: async (parent, { id }, context, info) => {
      if (!context.currentUser) throw new AuthenticationError("Login required");
      return context.db.users.findById(id);
    },

    users: async (_, { filter, first = 10, after }, { db }) => {
      const cursor = after ? decodeCursor(after) : null;
      const items = await db.users.findMany({ filter, cursor, limit: first + 1 });
      const hasNextPage = items.length > first;
      const edges = items.slice(0, first).map(user => ({
        node: user,
        cursor: encodeCursor(user.id),
      }));
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: await db.users.count({ filter }),
      };
    },
  },

  // Object type resolvers:
  User: {
    // parent = User object từ Query.user resolver
    // Resolver chỉ chạy nếu field được REQUEST trong query
    posts: async (user, { first = 10 }, { db }) => {
      // user.id available từ parent!
      return db.posts.findByAuthor(user.id, { limit: first });
    },

    // Default resolver: nếu không define → tự động return parent[fieldName]
    // User.name không cần define nếu user object đã có .name property
    name: (user) => user.name,     // default resolver (redundant)
    email: (user) => user.email,   // default resolver (redundant)

    // Computed field (không có trong DB):
    fullName: (user) => `${user.firstName} ${user.lastName}`,

    // Auth check per field:
    email: (user, _, { currentUser }) => {
      if (currentUser?.id !== user.id && !currentUser?.isAdmin) {
        return null;  // hide email from others
      }
      return user.email;
    },
  },

  Mutation: {
    createPost: async (_, { input }, { db, currentUser }) => {
      if (!currentUser) throw new AuthenticationError("Login required");

      const post = await db.posts.create({
        ...input,
        authorId: currentUser.id,
      });
      return post;
    },
  },

  // Union resolver:
  SearchResult: {
    __resolveType(obj) {
      if (obj.email) return "User";
      if (obj.title) return "Post";
      if (obj.sku) return "Product";
    },
  },
};
```

## 4.3 Context — Shared Data Per Request

```javascript
// Context: object shared across all resolvers trong 1 request.
// Dùng cho: database connection, current user, DataLoaders

// Apollo Server:
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    // Runs once per request
    const token = req.headers.authorization?.replace("Bearer ", "");
    const currentUser = token ? await verifyToken(token) : null;

    return {
      db: {
        users: UserRepository,
        posts: PostRepository,
      },
      currentUser,
      // DataLoader instances (new per request! không share giữa requests)
      loaders: {
        userById: new DataLoader(ids => batchLoadUsers(ids)),
        postsByAuthor: new DataLoader(ids => batchLoadPosts(ids)),
      },
    };
  },
});

// Spring Boot GraphQL - DataFetchingEnvironment:
@QueryMapping
public User user(@Argument String id, DataFetchingEnvironment env) {
  // env.getContext() → context per request
  GraphQLContext ctx = env.getGraphQlContext();
  User currentUser = ctx.get("currentUser");
  return userService.findById(id);
}
```

---

# 5. N+1 Problem Trong GraphQL & DataLoader

## 5.1 Tại Sao N+1 Nghiêm Trọng Hơn Trong GraphQL

```
Query:
  { users { name posts { title } } }

Execution:
  Query.users → SELECT * FROM users         (1 query, returns 100 users)
  User[0].posts → SELECT * FROM posts WHERE author_id = 1  (query 2)
  User[1].posts → SELECT * FROM posts WHERE author_id = 2  (query 3)
  ...
  User[99].posts → SELECT * FROM posts WHERE author_id = 100 (query 101)

TOTAL: 101 DB queries!

GraphQL tệ hơn REST vì:
  REST: developer viết query join → có ý thức về N+1
  GraphQL: resolver per field → N+1 ẩn trong resolver code
  Client thêm 1 field vào query → có thể trigger N queries mới!
  Developer không nhận thấy cho đến production performance issue.
```

## 5.2 DataLoader — Giải Pháp Chuẩn

```javascript
import DataLoader from "dataloader";

// DataLoader mechanism:
// 1. Collect tất cả load() calls trong CÙNG tick (event loop)
// 2. Batch chúng vào 1 bulk request
// 3. Distribute results về từng caller

// Batch function: nhận [id1, id2, ...] → trả [value1, value2, ...]
// ORDER MUST MATCH! [id1, id2] → [result_for_id1, result_for_id2]
async function batchLoadUsers(userIds) {
  // 1 query cho TẤT CẢ ids:
  const users = await db.users.findByIds(userIds);

  // Map về đúng thứ tự:
  const userMap = users.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {});

  // QUAN TRỌNG: return theo đúng thứ tự input ids
  return userIds.map(id => userMap[id] || null);
}

// Tạo DataLoader (new instance PER REQUEST!):
const userLoader = new DataLoader(batchLoadUsers, {
  maxBatchSize: 100,   // max IDs per batch
  cache: true,         // cache trong request (default true)
  // cache: false      // khi data thay đổi thường xuyên
});

// Trong resolver:
const resolvers = {
  Post: {
    author: async (post, _, { loaders }) => {
      // KHÔNG gọi DB trực tiếp:
      // return db.users.findById(post.authorId);  // N+1!

      // Dùng DataLoader:
      return loaders.userById.load(post.authorId);
      // load() KHÔNG chạy ngay!
      // Được "collected" cùng với các load() khác trong same tick
    },
  },
};

// Flow với DataLoader:
// Tick 1: Post[0].author → userLoader.load(1)    // queued
//         Post[1].author → userLoader.load(2)    // queued
//         Post[2].author → userLoader.load(3)    // queued
//         ... (100 posts)
// End of tick: DataLoader fires batchLoadUsers([1,2,3,...,100])
// → SELECT * FROM users WHERE id IN (1,2,3,...,100)  // 1 QUERY!
// Each promise resolves with correct user
```

## 5.3 DataLoader Cho Relationships

```javascript
// One-to-many: posts by author
const postsByAuthorLoader = new DataLoader(async (authorIds) => {
  const posts = await db.posts.findByAuthorIds(authorIds);
  // Group posts by authorId:
  const grouped = authorIds.map(id =>
    posts.filter(p => p.authorId === id)  // each author gets their posts array
  );
  return grouped;
});

// Context setup (new per request):
context: ({ req }) => ({
  loaders: createLoaders(),
})

function createLoaders() {
  return {
    userById: new DataLoader(batchLoadUsers),
    postsByAuthor: new DataLoader(batchLoadPostsByAuthor),
    commentsByPost: new DataLoader(batchLoadCommentsByPost),
  };
}

// CACHING trong DataLoader:
// Trong cùng request: load(id) lần 2 → trả cached result (no second DB call!)
// Giữa requests: không cache (new DataLoader per request)
// Tại sao không cache giữa requests? Data có thể thay đổi.
// Nếu muốn cross-request cache → dùng Redis, separate cache layer.
```

---

# 6. GraphQL vs REST — So Sánh Thực Tế

## 6.1 Khi Nào GraphQL Tốt Hơn REST

```
GRAPHQL WIN:
✅ Multiple clients với different data needs (mobile vs web vs TV app)
   Mobile: user { name, avatar }
   Web:    user { name, avatar, email, bio, posts { title } }
   → Cùng 1 endpoint, khác query

✅ Rapid frontend development
   Frontend thêm field mới → không cần backend change!
   (chỉ cần field đó có trong schema và resolver)

✅ Complex, deeply nested data relationships
   social feed = posts + users + likes + comments + reposts → 1 query

✅ API exploration (introspection)
   GraphQL tự document chính nó! Playground hiển thị tất cả types/fields.

✅ Real-time với subscriptions
   Cùng schema cho query + mutation + subscription

REST WIN:
✅ File upload/download (GraphQL phức tạp với binary)
✅ Simple CRUD APIs (GraphQL overhead không đáng)
✅ HTTP caching (GET requests cache tự nhiên; GraphQL POST không cache)
✅ Team quen REST (learning curve GraphQL)
✅ Public API cho external parties (REST widely understood)
✅ Microservices internal (gRPC tốt hơn cả hai)
```

## 6.2 Introspection — Self-documenting API

```graphql
# GraphQL có thể query chính schema của nó:
query IntrospectSchema {
  __schema {
    types {
      name
      kind
      fields {
        name
        type { name kind }
        description
      }
    }
  }
}

# Query type cụ thể:
query IntrospectUser {
  __type(name: "User") {
    name
    fields {
      name
      type { name kind ofType { name } }
      isDeprecated
      deprecationReason
    }
  }
}

# Đây là cơ sở của:
# - GraphQL Playground / GraphiQL: auto-complete, docs
# - Code generators: graphql-codegen tạo TypeScript types từ schema
# - Schema validation tools

# PRODUCTION: disable introspection!
# Attackers có thể khám phá toàn bộ API structure
```

---

# 7. Error Handling

## 7.1 GraphQL Error Types

```javascript
// GraphQL response luôn có shape:
{
  "data": { ... },       // partial data (có thể có dù có errors!)
  "errors": [            // array of errors
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND",
        "http": { "status": 404 }
      }
    }
  ]
}

// KHÁC VỚI REST:
// REST: HTTP 200 = success, HTTP 4xx/5xx = error
// GraphQL: HTTP 200 LUÔN (kể cả khi có errors!)
// GraphQL partial success: data CÓ THỂ có data và errors cùng lúc!
// { data: { user: { name: "Khang" }, posts: null },
//   errors: [{ message: "Failed to fetch posts", path: ["posts"] }] }

// Error types:
// 1. Syntax/Validation errors → no execution, HTTP 400
// 2. Resolver errors → partial execution, HTTP 200 + errors array
```

## 7.2 Custom Errors

```javascript
import { GraphQLError } from "graphql";

// Custom error với extensions:
throw new GraphQLError("User not found", {
  extensions: {
    code: "NOT_FOUND",
    userId: id,
    http: { status: 404 },
  },
});

// Error classes:
class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } }
    });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: { code: "FORBIDDEN", http: { status: 403 } }
    });
  }
}

class ValidationError extends GraphQLError {
  constructor(message, field) {
    super(message, {
      extensions: { code: "VALIDATION_ERROR", field, http: { status: 400 } }
    });
  }
}

// Error masking in production:
const server = new ApolloServer({
  formatError: (formattedError, error) => {
    // In production: hide internal error details
    if (process.env.NODE_ENV === "production") {
      if (error instanceof DatabaseError) {
        return { message: "Internal server error", extensions: { code: "INTERNAL_ERROR" } };
      }
    }
    return formattedError;
  },
});
```

## 7.3 Union Error Pattern (Recommended)

```graphql
# Thay vì throw GraphQL errors (toplevel errors array),
# model errors trong type system:

type CreateUserSuccess {
  user: User!
}

type ValidationError {
  field: String!
  message: String!
}

type DuplicateEmailError {
  email: String!
  message: String!
}

union CreateUserResult =
  CreateUserSuccess
  | ValidationError
  | DuplicateEmailError

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult!
}
```

```javascript
// Resolver:
createUser: async (_, { input }, { db }) => {
  const existing = await db.users.findByEmail(input.email);
  if (existing) {
    return {
      __typename: "DuplicateEmailError",
      email: input.email,
      message: "Email already in use",
    };
  }
  const user = await db.users.create(input);
  return { __typename: "CreateUserSuccess", user };
},

// Client:
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    ... on CreateUserSuccess {
      user { id name }
    }
    ... on ValidationError {
      field
      message
    }
    ... on DuplicateEmailError {
      email
      message
    }
  }
}
// Benefits: type-safe errors, client handles each error case explicitly
```

---

# 8. Authentication & Authorization

## 8.1 Authentication (Who Are You?)

```javascript
// JWT Authentication trong context:
context: async ({ req }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  let currentUser = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = await db.users.findById(decoded.userId);
    } catch (e) {
      // Token invalid/expired → currentUser remains null
    }
  }

  return { db, currentUser, loaders: createLoaders() };
},

// Trong resolver:
Query: {
  me: (_, __, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError("Not authenticated");
    return currentUser;
  },
},
```

## 8.2 Authorization (What Can You Do?)

```javascript
// Approach 1: Check trong resolver
Post: {
  email: (post, _, { currentUser }) => {
    if (currentUser?.id !== post.authorId && !currentUser?.isAdmin) {
      throw new ForbiddenError("Cannot view this email");
    }
    return post.email;
  },
},

// Approach 2: Shield (graphql-shield) — rule-based
import { rule, shield, and, or, not } from "graphql-shield";

const isAuthenticated = rule()(async (parent, args, ctx) => {
  return ctx.currentUser !== null;
});

const isAdmin = rule()(async (parent, args, ctx) => {
  return ctx.currentUser?.role === "ADMIN";
});

const isPostAuthor = rule()(async (parent, args, ctx) => {
  const post = await ctx.db.posts.findById(args.id || parent.id);
  return post?.authorId === ctx.currentUser?.id;
});

const permissions = shield({
  Query: {
    users: isAdmin,
    me: isAuthenticated,
  },
  Mutation: {
    createPost: isAuthenticated,
    deletePost: or(isAdmin, isPostAuthor),
  },
  User: {
    email: or(isAdmin, isAuthenticated),
  },
});

// Approach 3: Directive
const typeDefsWithDirective = `
  directive @auth(role: UserRole) on FIELD_DEFINITION

  type Query {
    adminStats: Stats @auth(role: ADMIN)
    myPosts: [Post!]! @auth
  }
`;
```

---

# 9. Apollo Federation — Micro-service GraphQL

## 9.1 Vấn Đề: Nhiều GraphQL Services

```
Microservices, mỗi service có schema riêng:
  User Service:    { User, Query { user, users } }
  Product Service: { Product, Query { product, products } }
  Order Service:   { Order, Query { order, orders } }

Vấn đề:
  Client cần data từ nhiều services → multiple requests!
  Hoặc: 1 BFF (Backend for Frontend) aggregate → complexity

Apollo Federation giải pháp:
  1 Supergraph = combine tất cả subgraph schemas
  Client query 1 endpoint → Router điều phối đến đúng services
  Services có thể extend types của nhau!
```

## 9.2 Federation Schema

```graphql
# user-service schema:
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
  me: User
}

# order-service schema:
# Extend User type từ user-service:
type User @key(fields: "id") {
  id: ID!  # reference key
  orders: [Order!]!  # add field to User!
}

type Order @key(fields: "id") {
  id: ID!
  userId: ID!
  items: [OrderItem!]!
  total: Float!
  status: OrderStatus!
}

type Query {
  order(id: ID!): Order
}
```

```javascript
// order-service resolver:
const resolvers = {
  User: {
    // __resolveReference: how to load User entity given its key
    __resolveReference: async (user, { db }) => {
      // Called when Router needs User data from User service
      return db.users.findById(user.id);
    },
    orders: async (user, _, { db }) => {
      return db.orders.findByUserId(user.id);
    },
  },
};

// Router (Apollo Gateway hoặc GraphQL Mesh) combines schemas:
// Client query:
// { user(id: "1") { name orders { id total } } }
// → Router: user.name → User Service
//            user.orders → Order Service (with user { id })
// → Router merges results → single response to client
```

---

# 10. Performance & Security

## 10.1 Query Complexity & Depth Limiting

```javascript
import depthLimit from "graphql-depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";

const server = new ApolloServer({
  validationRules: [
    // Limit depth: prevent deeply nested queries
    depthLimit(7),  // { user { friends { friends { friends ... } } } } → rejected!

    // Limit complexity: each field costs points
    createComplexityLimitRule(1000, {
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
    }),
    // { users { posts { comments { author { posts ... } } } } }
    // → complexity calculated → reject if > 1000
  ],
});

// Custom complexity calculation:
const costMap = {
  Query: { users: { multiplier: "first", useMultipliers: true } },
  User: { posts: { multiplier: "first", useMultipliers: true } },
};
```

## 10.2 Persisted Queries

```javascript
// Vấn đề: client có thể gửi bất kỳ query nào → attack surface
// Giải pháp: Persisted Queries — chỉ accept pre-registered queries

// Client: gửi query hash thay vì full query text
POST /graphql
{
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38"
    }
  }
}

// Server: lookup hash → tìm stored query → execute
// Nếu hash không có → request full query text → store → execute
// Production: disable query text fallback → ONLY persisted queries accepted!

// Benefits: reduce attack surface, smaller request payloads, analytics
```

## 10.3 Caching Strategy

```javascript
// Apollo Server: per-field cache hints
type Query {
  user(id: ID!): User @cacheControl(maxAge: 30)         # 30s
  publicPosts: [Post!]! @cacheControl(maxAge: 60, scope: PUBLIC)  # CDN cacheable!
  me: User @cacheControl(maxAge: 0, scope: PRIVATE)     # never cache (user-specific)
}

// Apollo Client: normalized cache
import { InMemoryCache } from "@apollo/client";

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ["id"],  // cache key: User:id
    },
    Post: {
      keyFields: ["id"],
      fields: {
        // Merge pagination:
        comments: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});
// Cache normalizes: User:1 stored once, referenced many times
// Update User:1 → all queries showing User:1 auto-update!
```

---

# 11. Spring Boot + GraphQL

## 11.1 Setup

```xml
<!-- pom.xml -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-graphql</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  graphql:
    graphiql:
      enabled: true       # Enable GraphiQL playground at /graphiql
      path: /graphiql
    schema:
      locations: classpath:graphql/**/  # .graphqls files location
    websocket:
      path: /graphql      # Subscription endpoint
```

## 11.2 Schema & Controllers

```graphql
# src/main/resources/graphql/schema.graphqls
type Query {
  user(id: ID!): User
  users: [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}

type Subscription {
  userCreated: User!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

input CreateUserInput {
  name: String!
  email: String!
}
```

```java
// UserController.java
@Controller
public class UserController {

    private final UserService userService;
    private final SinkPublisher<User> userPublisher;

    // Query:
    @QueryMapping
    public User user(@Argument String id) {
        return userService.findById(id);
    }

    @QueryMapping
    public List<User> users() {
        return userService.findAll();
    }

    // Mutation:
    @MutationMapping
    public User createUser(@Argument CreateUserInput input) {
        User user = userService.create(input);
        userPublisher.tryEmitNext(user);  // trigger subscription
        return user;
    }

    // Subscription:
    @SubscriptionMapping
    public Flux<User> userCreated() {
        return userPublisher.asFlux();
    }

    // Field resolver (N+1 với DataLoader):
    @SchemaMapping(typeName = "User", field = "posts")
    public CompletableFuture<List<Post>> posts(
            User user,
            DataLoader<String, List<Post>> postsByUserLoader) {
        // DataLoader batching!
        return postsByUserLoader.load(user.getId());
    }
}

// DataLoader configuration:
@Configuration
public class DataLoaderConfig {

    @Bean
    public DataLoaderRegistrar<String, List<Post>> postsByUserLoader(PostService postService) {
        return DataLoaderRegistrar.forName("postsByUser",
            DataLoader.newMappedDataLoader(async (userIds, env) -> {
                Map<String, List<Post>> postsByUser =
                    postService.findByUserIds(new ArrayList<>(userIds));
                return postsByUser;
            }));
    }
}
```

## 📎 Official Documentation Links

| Topic | Link |
|---|---|
| GraphQL Specification | <https://spec.graphql.org> |
| Apollo Server | <https://www.apollographql.com/docs/apollo-server> |
| Apollo Client | <https://www.apollographql.com/docs/react> |
| Apollo Federation | <https://www.apollographql.com/docs/federation> |
| DataLoader | <https://github.com/graphql/dataloader> |
| graphql-shield | <https://the-guild.dev/graphql/shield> |
| Spring GraphQL | <https://docs.spring.io/spring-graphql/reference> |
| The Guild (GraphQL tools) | <https://the-guild.dev> |
