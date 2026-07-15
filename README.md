# esdm-vue-reader

A **stack-agnostic domain console** for applications generated from
[ESDM](https://www.esdm.io/) models: send commands, watch them become events, see the
read models update — before any end-user UI exists.

One build drives **any** conforming app, no matter which generator target produced it
(Symfony, Nimbus or Django; on PostgreSQL or EventSourcingDB + MongoDB, …). The viewer contains zero
stack-specific code: everything it renders comes from the target app over the
**[Domain Console Contract (esdm-extensions 0004)](https://github.com/r-sw-eet/esdm-extensions/blob/main/proposals/0004-domain-console-contract.md)**:

| The app serves | The viewer renders |
|---|---|
| `GET /_dev/catalog` | command forms (with 0002 FEEL input hints), read-model tables, 0001 lifecycle views |
| `GET /_dev/events` | the raw append-only event stream, newest first |
| `GET /_dev/bpmn` | the authoring diagram in an embedded bpmn.io modeler (Author tab) |
| `POST /<context>/<command>`, `GET /<context>/<query>` | the actual domain interaction |

## Run

```sh
npm install
npm run dev
# open http://localhost:5173 and connect to a running generated app,
# e.g. http://localhost:8080
```

No app to point at yet? Generate one from an ESDM model with
[esdm-2-symfony](https://github.com/r-sw-eet/esdm-2-symfony) or
[esdm-2-nimbus](https://github.com/r-sw-eet/esdm-2-nimbus), then `docker compose up` it.

Ways to pass the target app:

- type its base URL into the connect form (persisted in localStorage),
- `http://localhost:5173/?app=http://localhost:8080`,
- `VITE_APP_URL=http://localhost:8080 npm run dev`.

The target app must allow cross-origin requests in dev — the 0004 contract requires it,
and apps from the reference generators do.

## Build

```sh
npm run build    # static bundle in dist/ — serve it from anywhere
```

## What lives where

- The **wire contract** is owned by the
  [esdm-extensions](https://github.com/r-sw-eet/esdm-extensions) spec repo (proposal 0004) —
  this viewer is its reference consumer, the generators below are its producers.
- The **reference generators** turn an ESDM model into a conforming app:
  [esdm-2-symfony](https://github.com/r-sw-eet/esdm-2-symfony) (PHP · Symfony),
  [esdm-2-nimbus](https://github.com/r-sw-eet/esdm-2-nimbus) (TypeScript · Nimbus) and
  [esdm-2-python](https://github.com/r-sw-eet/esdm-2-python) (Python · Django), each with a
  PostgreSQL or EventSourcingDB + MongoDB event-store target.
  Generate and boot one, then point the viewer at it.
- The **Author (BPMN) tab** is read/export only: edit, export `.bpmn`, save it to the app's
  `authoring/` directory and re-run the 0003 mapper — the viewer never writes back.

## License

[MIT](LICENSE) © 2026 Ralf Süss
