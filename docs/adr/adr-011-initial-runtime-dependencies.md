---
Status: Accepted
Created: 2026-09-12
Decided: 2026-09-12
Contributors: Joe Martin, Claude
Decision Maker: Joe Martin
Superseded By:
Related ADRs: adr-005-fan-out-between-tasks.md, adr-006-token-verification.md, adr-009-data-store.md
---

# ADR-011: Initial runtime dependencies

## Question Under Consideration

Which npm packages do the services and the web client start with? The constraint is minimal dependencies, AWS primitives and the standard library over third-party packages (CON-06), against a weekend timebox (CON-01). Each slot below is a place where the standard library was weighed against a package.

## Decision

The MVP is built with the packages in the table. Packages added later are not recorded here.

| Slot                           | Package                        | Alternatives considered                         | Inflection point                                                                                                                                                                                            |
| ------------------------------ | ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data access and schema         | drizzle-orm, drizzle-kit       | Hand-written SQL with pg alone; Kysely; Prisma  | Typed queries and generated migrations from one TypeScript schema; the Data API driver runs migrations from the deploy job (operational-design.md, Schema migration). Prisma carries its own engine binary. |
| Postgres driver                | pg                             | postgres.js                                     | Drizzle's node-postgres adapter, a pool per task, and documented IAM token use as the password callback.                                                                                                    |
| IAM database token             | @aws-sdk/rds-signer            | Sign the request by hand                        | Signing an RDS auth token is a SigV4 presign; the SDK package is the primitive.                                                                                                                             |
| Data API client for migrations | @aws-sdk/client-rds-data       | None                                            | Required by drizzle-kit's Data API driver; used by the deploy job only.                                                                                                                                     |
| Valkey client                  | iovalkey                       | ioredis; @valkey/valkey-glide                   | ioredis API maintained by the Valkey project; plain npm install. glide is newest with a native core and a different API.                                                                                    |
| ID token verification          | jose                           | google-auth-library; hand-rolled JWKS and RS256 | One small package with a remote JWKS cache that honours Cache-Control (NFR-06) and serves both the HTTP and socket paths (ADR-006). Google's library carries OAuth flows the service does not use.          |
| HTTP server                    | fastify                        | Node http module with an own router; express    | Routing, JSON bodies, schema validation, and a per-request hook for verify and resolve, inside the timebox. The http module costs an hour or two of scaffolding first.                                      |
| Request validation             | zod, fastify-type-provider-zod | fastify built-in JSON Schema                    | One schema gives the parsed type and the validation; the same zod schemas describe the socket messages and the web client payloads. JSON Schema validates without typing the result.                        |
| WebSocket server               | ws                             | uWebSockets.js                                  | The standard library for Node sockets, attaches to the Node http server so the ticket check runs on upgrade, installs from npm. uWebSockets.js installs from GitHub with its own HTTP server.               |
| Web client                     | react, react-dom, vite         | Plain HTML and TypeScript                       | State for flock lists and live message pages, and Google's documented sign-in path for React. The web client is the named scope-creep risk (RSK-03); hand-written DOM updates make it slower.               |

## Rationale

Each package replaces code that would otherwise be written and explained in the repo; the shortest path in the timebox wins where the package is standard and installs from npm. Native binaries and GitHub installs were rejected in every slot because they complicate the container build and the reader's setup.

## Consequences

Eleven runtime packages across the services and the web client, plus aws-cdk-lib and constructs for infrastructure (CON-04). The shared package wraps drizzle-orm, pg, the signer, iovalkey, and jose, so a service imports the shared package, zod, and fastify or ws only.

## Revisit When

A package stops being maintained or changes licence. The Rust WebSocket service in ADR-002 is built: the ws, fastify, and jose rows do not apply to it. Measured memory per socket makes uWebSockets.js worth its install path.
