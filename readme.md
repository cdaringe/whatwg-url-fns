# whatwg-url-fns

Delightful WHATWG URL transform functions.

Given a [URL](https://url.spec.whatwg.org/#url), produce another safely and concisely, declaring the next fields to applied to the existing URL.

[![CI](https://github.com/cdaringe/whatwg-url-fns/actions/workflows/main.yml/badge.svg)](https://github.com/cdaringe/whatwg-url-fns/actions/workflows/main.yml)

## install

```ts
pnpm install --save whatwg-url-fns
npm install --save whatwg-url-fns
```

## usage

A quick example:

```ts
import { transform } from "whatwg-url-fns";

const url: URL = transform(
  "https://example.com:8080/path?baz=1#hash", // URL | string
  {
    pathname: "/next-page",
    hash: "", // clear out the hash
    searchParams: {
      set: { foo: "bar" },
      unset: ["baz"],
      // [clear: true] // empty the searchParams before running set operations
    },
  },
);
url.toString(); // https://example.com:8080/next-page?foo=bar
```

1. The implementation is thoughtfully typed and prevents conflicting URL inputs,
   such as `origin` and `hostname`.
2. `searchParams` accept `set`/`unset/clear` collections. Precedence matters. `clear` occurs first, then `set`, then `unset`.
3. Stringy-fields can be cleared by passing the empty string.
4. Browser and node.js friendly.

See [the tests](./src/index.test.ts) for more examples.
