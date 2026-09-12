# Request flows

One file per flow. Each shows the route, a sequence diagram, and the authorization check.

| Workflow ID | Requirement ID | Flow                                                       |
| ----------- | -------------- | ---------------------------------------------------------- |
| WFL-01      | FR-01          | [Sign in](wfl-01-sign-in.md)                               |
| WFL-02      | FR-02          | [Create flock](wfl-02-create-flock.md)                     |
| WFL-03      | FR-03          | [List flocks](wfl-03-list-flocks.md)                       |
| WFL-04      | FR-04          | [Add member](wfl-04-add-member.md)                         |
| WFL-05      | FR-05, FR-06   | [Send message](wfl-05-send-message.md)                     |
| WFL-06      | FR-07          | [Load history](wfl-06-load-history.md)                     |
| WFL-07      | FR-06          | [Connect and disconnect](wfl-07-connect-and-disconnect.md) |
| WFL-08      | FR-08          | [Delete flock](wfl-08-delete-flock.md)                     |

## Every HTTP request

The browser sends the Google ID token as `Authorization: Bearer`. The load balancer routes by path prefix to one service. Before the route handler runs, the shared package:

1. Verifies the token: signature against Google's cached keys, issuer, audience, expiry (ADR-006). Any failure is 401.
2. Opens a transaction and sets app.pond_id from configuration and app.google_subject from the token's sub claim.
3. Resolves the caller: reads the duck by google_subject and sets app.duck_id. No row is 401; the client signs in first (WFL-01). Only the ducks service writes ducks.
4. Runs the handler. The handler checks the route's rule in code and answers 403 on refusal; the row-level security policies in data-model.md enforce the same rule on every query.

Diagrams show steps 1 to 3 as one line, "verify token, resolve caller".

## Responses

| Status   | Meaning                                                                |
| -------- | ---------------------------------------------------------------------- |
| 200, 201 | Success; the body is the record the flow names                         |
| 400      | The body fails validation                                              |
| 401      | Token missing, invalid, or expired; or no duck for the token's subject |
| 403      | The caller is not a member of the flock, or not its owner              |
| 404      | The duck does not exist                                                |
| 409      | A unique constraint: display name, flock name, membership              |

The policies hide a flock from a non-member, so a service cannot tell a flock that does not exist from one the caller is not in. Both are 403. Ducks are visible to every member of the pond, so an unknown duck is 404.

## Live delivery

A socket subscribes to the fan-out topic of each flock the caller belongs to when it connects (wfl-07-connect-and-disconnect.md), and that set does not change while the socket is open. Adding a member and deleting a flock do not touch open sockets in the MVP:

- A new member receives the flock's messages on their next connect.
- A deleted flock's subscribers keep a topic nothing publishes to; the client learns on its next flock list or a 403.

Post-MVP this needs control events: each socket also subscribes to a per-duck topic, add member publishes the flock ID to the new member's topic so the task subscribes, and delete flock publishes a deleted event on the flock topic so tasks unsubscribe and clients drop the flock.
