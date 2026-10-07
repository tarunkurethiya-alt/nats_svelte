# Folder Structure

A SvelteKit 2 + Svelte 5 whiteboard that shares drawing events over NATS. Layered
("clean") architecture: dependencies point **down only**, and a composition root wires
the layers together.

```
Component (.svelte) -> Store -> UseCase -> Repository interface (domain)
                                                ^ implemented by
                                      Repository impl (infra) -> NATS + Mapper
```

## Layout

```
src/
  routes/
    +layout.ts                 ssr = false; calls bootstrapApp() on load
    +layout.svelte             global CSS, favicon
    +page.svelte               renders <Whiteboard />
  lib/
    domain/                    NO imports from infra, presentation or any library
      entities/                plain types: point, brush, segment, board-event
      repositories/            contracts (I*Repository) the domain needs
      usecases/                thin classes that depend on a repository interface
    infra/                     everything that talks to the outside world
      data/repositories/       implements a domain repository using NATS
      mappers/                 static, pure DTO <-> domain conversion (+ tests)
      nats/                    opens the NATS connection
    presentation/              everything the user sees
      stores/                  Svelte 5 rune state + actions (+ tests)
      components/              .svelte files
      utils/                   view helpers (canvas renderer)
    bootstrap/                 COMPOSITION ROOT: only place allowed to import all layers
      index.ts                 bootstrapApp() / teardownApp()
      realtime.bootstrap.ts    connects / disconnects NATS
      types.ts                 FeatureModule, FeatureAdapters
      config.ts                subject name, WebSocket URL
      features/                one module per feature + allFeatures[]
    utils/                     framework-free helpers (logger)
```

## Diagrams

### Layers and dependencies

Arrows mean "imports". `bootstrap` is the only layer that sees all the others.

```mermaid
flowchart TD
    subgraph routes["routes/"]
        layout["+layout.ts<br/>ssr = false"]
        page["+page.svelte"]
    end

    subgraph bootstrap["lib/bootstrap/ (composition root)"]
        boot["index.ts<br/>bootstrapApp / teardownApp"]
        rt["realtime.bootstrap.ts"]
        feat["features/whiteboard.feature.ts"]
        cfg["config.ts"]
    end

    subgraph presentation["lib/presentation/"]
        comp["components/Whiteboard.svelte"]
        store["stores/whiteboard.store.svelte.ts"]
        canvas["utils/canvas-renderer.ts"]
    end

    subgraph domain["lib/domain/ (no outside imports)"]
        uc["usecases/whiteboard.usecases.ts"]
        iface["repositories/board-event.repository.ts<br/>IBoardEventRepository"]
        ent["entities/<br/>point, brush, segment, board-event"]
    end

    subgraph infra["lib/infra/"]
        repo["data/repositories/board-event.repository.ts"]
        mapper["mappers/board-event.mapper.ts"]
        conn["nats/nats-connection.ts"]
    end

    nats[("NATS server")]

    layout --> boot
    page --> comp
    boot --> rt
    boot --> feat
    feat --> cfg
    feat --> repo
    feat --> uc
    feat --> store
    rt --> conn

    comp --> store
    comp --> canvas
    store --> uc
    canvas -. "implements BoardView" .-> store

    uc --> iface
    uc --> ent
    iface --> ent

    repo -. "implements" .-> iface
    repo --> mapper
    mapper --> ent
    conn --> nats
    repo --> nats
```

### Drawing and receiving

```mermaid
sequenceDiagram
    actor Me
    participant C as Whiteboard.svelte
    participant S as whiteboardStore
    participant V as CanvasRenderer
    participant U as WhiteboardUseCases
    participant R as BoardEventRepository
    participant M as BoardEventMapper
    participant N as NATS
    actor Other as Other user

    Me->>C: pointermove
    C->>S: continueStroke(point, brush)
    S->>V: drawSegment (local, instant)
    S->>U: shareSegment(segment)
    U->>R: publish(DrawEvent with my userId)
    R->>M: toDTO(event)
    M-->>R: wire object
    R->>N: publish bytes on whiteboard.room1

    N-->>R: message (including my own)
    R->>M: toDomain(parsed JSON)
    M-->>R: BoardEvent or throws
    R->>U: handler(event)
    alt event.userId is mine
        Note over U: dropped (already drawn locally)
    else from another user
        U->>S: handler(event)
        S->>V: drawSegment / clear
    end

    N-->>Other: same message
```

### Startup

```mermaid
sequenceDiagram
    participant L as +layout.ts load()
    participant B as bootstrapApp
    participant RT as connectRealtime
    participant F as whiteboardFeature.create
    participant S as whiteboardStore

    L->>B: bootstrapApp(natsWebSocketUrl())
    B->>RT: connect (once)
    RT-->>B: NatsConnection
    B->>F: create({ realtimeAdapter })
    F->>S: init(new WhiteboardUseCases(repo, userId))
    F->>S: setConnected(true)
    Note over F,S: when nc.closed() resolves,<br/>setConnected(false)
    B-->>L: ready, page renders
```

## What each layer may import

| Layer | May import | Must not import |
|---|---|---|
| `domain` | itself | infra, presentation, bootstrap, `nats.ws`, DOM |
| `infra` | domain, utils, `nats.ws` | presentation, bootstrap |
| `presentation` | domain, utils | infra, `nats.ws` |
| `bootstrap` | everything | n/a |
| `utils` | nothing from the app | all layers |

Rules of thumb:

- Components import **stores only**, never use cases or repositories.
- Stores never import the transport; they hold a use-case instance set via `init()`.
- Domain names never mention the technology (`IBoardEventRepository`, not `INats...`).
- Mappers are static and pure; never convert wire data inline in a repository.

## Where things live (this project)

| Concern | File |
|---|---|
| Wire format and validation | `infra/mappers/board-event.mapper.ts` |
| Publish / subscribe over NATS | `infra/data/repositories/board-event.repository.ts` |
| "Which events are mine" rule | `domain/usecases/whiteboard.usecases.ts` |
| Stroke tracking, connected flag | `presentation/stores/whiteboard.store.svelte.ts` |
| Drawing on the canvas | `presentation/utils/canvas-renderer.ts` |
| Wiring it all together | `bootstrap/features/whiteboard.feature.ts` |

## Request flow

**Drawing:** pointer event -> `Whiteboard.svelte` -> `whiteboardStore.continueStroke`
-> draws locally via `BoardView` -> `WhiteboardUseCases.shareSegment`
-> `BoardEventRepository.publish` -> `BoardEventMapper.toDTO` -> NATS.

**Receiving:** NATS -> `BoardEventRepository.subscribe` -> `BoardEventMapper.toDomain`
-> `WhiteboardUseCases.subscribeToRemoteEvents` (drops our own events)
-> store handler -> `BoardView.drawSegment`.

## Add-a-feature checklist

1. `domain/entities/foo.ts`
2. `domain/repositories/foo.repository.ts`
3. `domain/usecases/foo.usecases.ts`
4. `infra/mappers/foo.mapper.ts` (+ test)
5. `infra/data/repositories/foo.repository.ts`
6. `presentation/stores/foo.store.svelte.ts` (`init`, actions, `reset`)
7. `bootstrap/features/foo.feature.ts`, registered in `bootstrap/features/index.ts`
8. A component under `presentation/components/` and a route that renders it

## Testing

- Vitest, co-located: `foo.ts` -> `foo.test.ts`. Run with `npm test`.
- Test mappers, use cases with logic, stores and pure utils.
- Mock repository **interfaces**, not the transport.
- Skip components and repository implementations (integration territory).

## Conventions

- No `console.*`; use `createLogger('scope')` from `utils/logger.ts`.
- Relative imports inside `lib/`; the `$lib` alias is used from `routes/`.
- Never fetch or connect in `onMount`; connect in `+layout.ts` via `bootstrapApp()`.
  `onMount` is for binding the view and cleaning up.
