# whatwg-url-fns

Given a [URL](https://url.spec.whatwg.org/#url), produce another safely and concisely.

## install

```ts
pnpm install --save whatwg-url-fns
npm install --save whatwg-url-fns
```

## usage

```ts
import { transform } from "whatwg-url-fns";

const currentURL = new URL("https://example.com:8080/path?baz=1#hash");

const nextURL = transform({
  pathname: "/next-page",
  hash: "",
  searchParams: { set: { foo: "bar" }, unset: ["baz"] },
});
nextURL.toString(); // https://example.com:8080/next-page?baz=1&foo=bar
```
