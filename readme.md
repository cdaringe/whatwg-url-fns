# whatwg-url-fns

Delightful WHATWG URL transform functions.

Given a [URL](https://url.spec.whatwg.org/#url), produce another safely and concisely.

## install

```ts
pnpm install --save whatwg-url-fns
npm install --save whatwg-url-fns
```

## usage

```ts
import { transform } from "whatwg-url-fns";

const nextURL = transform(
  {
    pathname: "/next-page",
    hash: "",
    searchParams: { set: { foo: "bar" }, unset: ["baz"] },
  },
  /**
   * The URL to transform from. Accepts a string (e.g. window.location.href)
   * or a URL instance.
   */
  "https://example.com:8080/path?baz=1#hash"
);
nextURL.toString(); // https://example.com:8080/next-page?foo=bar
```
