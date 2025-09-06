import { describe, it, expect } from "vitest";
import { transform, joinPathnames } from "./index";

describe("URL Transformer", () => {
  // Helper function to create a base URL for testing
  const createBaseURL = () =>
    new URL("https://user:pass@example.com:8080/path?q=123#hash");

  describe("origin input", () => {
    it("should update urls", () => {
      const nextURL = transform("https://example.com:8080/path?baz=1#hash", {
        pathname: "/next-page",
        hash: "",
        searchParams: { set: { foo: "bar" }, unset: ["baz"] },
      });
      expect(nextURL.href).toMatchInlineSnapshot(
        `"https://example.com:8080/next-page?foo=bar"`,
      );
    });

    it("should handle origin updates", () => {
      const cases = [
        {
          input: {
            origin: "wss://socket.io:1234",
            username: "newuser",
            password: "newpass",
          },
          expected: "wss://newuser:newpass@socket.io:1234/path?q=123#hash",
        },
        {
          input: {
            origin: "http://newhost.com:9090",
            username: "",
            password: "",
          },
          expected: "http://newhost.com:9090/path?q=123#hash",
        },
        {
          input: {
            origin: "https://test.com",
            username: "",
            password: "",
          },
          expected: "https://test.com:8080/path?q=123#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("host input", () => {
    it("should handle host updates", () => {
      const cases = [
        {
          input: {
            host: "test.com",
            protocol: "http:",
            username: "",
            password: "",
          },
          expected: "http://test.com:8080/path?q=123#hash",
        },
        {
          input: {
            host: "newhost.com:9090",
            username: "",
            password: "",
          },
          expected: "https://newhost.com:9090/path?q=123#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("protocol + hostname", () => {
    it("should handle protocol and hostname updates", () => {
      const cases = [
        {
          input: {
            hostname: "newhost.com",
            port: "9090",
            protocol: "http:",
            username: "",
            password: "",
          },
          expected: "http://newhost.com:9090/path?q=123#hash",
        },
        {
          input: {
            hostname: "test.com",
            username: "newuser",
            password: "newpass",
          },
          expected: "https://newuser:newpass@test.com:8080/path?q=123#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("hostname-less", () => {
    it("should handle protocol and port updates", () => {
      const cases = [
        {
          input: {
            protocol: "wss:",
            port: "1234",
            username: "",
            password: "",
          },
          expected: "wss://example.com:1234/path?q=123#hash",
        },
        {
          input: {
            protocol: "http:",
            username: "newuser",
            password: "newpass",
          },
          expected: "http://newuser:newpass@example.com:8080/path?q=123#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });
  describe("pathname & hash", () => {
    it("should handle pathname and hash updates", () => {
      const cases = [
        {
          input: {
            hostname: "example.com",
            pathname: "/newpath",
            hash: "newhash",
            username: "",
            password: "",
          },
          expected: "https://example.com:8080/newpath?q=123#newhash",
        },
        {
          input: {
            hostname: "example.com",
            pathname: "/",
            hash: "",
            username: "",
            password: "",
          },
          expected: "https://example.com:8080/?q=123",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });

    const baseURL = "https://example.com/api";
    const cases = [
      {
        input: { pathname: { append: "/users" } },
        expected: "https://example.com/api/users",
      },
      {
        input: { pathname: { append: "users" } },
        expected: "https://example.com/api/users",
      },
      {
        input: { pathname: { append: "//users" } },
        expected: "https://example.com/api/users",
      },
      {
        input: { pathname: { append: "/users/" } },
        expected: "https://example.com/api/users/",
      },
      {
        input: { pathname: { append: "" } },
        expected: "https://example.com/api",
      },
      {
        input: { pathname: { append: "/foo/bar/baz" } },
        expected: "https://example.com/api/foo/bar/baz",
      },
    ] as const;

    it.each(cases)(`pathname append ($input.pathname.append)`, (it) => {
      const result = transform(baseURL, it.input);
      expect(result.href).toBe(it.expected);
    });
  });

  describe("search params", () => {
    it("should handle search params updates", () => {
      const cases = [
        {
          input: {
            hostname: "example.com",
            username: "",
            password: "",
            searchParams: {
              set: { newParam: "value", q: "newvalue" },
            },
          },
          expected:
            "https://example.com:8080/path?q=newvalue&newParam=value#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "",
            password: "",
            searchParams: {
              unset: ["q"],
            },
          },
          expected: "https://example.com:8080/path#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "",
            password: "",
            searchParams: {
              set: { new: "param" },
              unset: ["q"],
            },
          },
          expected: "https://example.com:8080/path?new=param#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "",
            password: "",
            searchParams: {
              clear: true,
              set: { foo: "bar" },
            },
          },
          expected: "https://example.com:8080/path?foo=bar#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "",
            pathnaum: "/bing",
            searchParams: {
              clear: true,
            },
          },
          expected: "https://example.com:8080/path#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("Username/Password Tests", () => {
    it("should handle username and password updates", () => {
      const cases = [
        {
          input: {
            hostname: "example.com",
            username: "newuser",
            password: "newpass",
          },
          expected: "https://newuser:newpass@example.com:8080/path?q=123#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "newuser",
            password: "",
          },
          expected: "https://newuser@example.com:8080/path?q=123#hash",
        },
        {
          input: {
            hostname: "example.com",
            username: "",
            password: "",
          },
          expected: "https://example.com:8080/path?q=123#hash",
        },
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(createBaseURL(), input);
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty port strings", () => {
      const result = transform(createBaseURL(), {
        hostname: "example.com",
        port: "",
        username: "",
        password: "",
      });
      expect(result.href).toBe("https://example.com/path?q=123#hash");
    });

    it("should preserve existing values when not specified", () => {
      const result = transform(createBaseURL(), {
        protocol: "http:",
        username: "",
        password: "",
      });
      expect(result.href).toBe("http://example.com:8080/path?q=123#hash");
    });
    it("verbose test", () => {
      const out = transform(
        "https://exampl.com/exampllive/gleb?foo=bar&baz=qux",
        {
          pathname: "/bing/bing",
          searchParams: { clear: true },
        },
      );
      expect(out.toString()).toBe("https://exampl.com/bing/bing");
    });
  });

  describe("joinPathnames utility function", () => {
    it("should handle basic path joining", () => {
      expect(joinPathnames("/api", "users")).toBe("/api/users");
      expect(joinPathnames("/api/", "/users")).toBe("/api/users");
      expect(joinPathnames("/api", "/users")).toBe("/api/users");
      expect(joinPathnames("/api/", "users")).toBe("/api/users");
    });

    it("should handle multiple slashes", () => {
      expect(joinPathnames("//api//", "//users//")).toBe("/api/users//");
      expect(joinPathnames("/api///", "///users")).toBe("/api/users");
    });

    it("should handle root paths", () => {
      expect(joinPathnames("/", "users")).toBe("/users");
      expect(joinPathnames("/", "/users")).toBe("/users");
      expect(joinPathnames("/", "")).toBe("/");
      expect(joinPathnames("", "/users")).toBe("/users");
      expect(joinPathnames("", "users")).toBe("/users");
    });

    it("should handle empty strings and edge cases for coverage", () => {
      expect(joinPathnames("", "")).toBe("/");
      expect(joinPathnames("/api/", "")).toBe("/api/"); // Test line 78 (startsWithSlash true, preserves original behavior)
      expect(joinPathnames("", "/users")).toBe("/users");
      expect(joinPathnames("api/", "")).toBe("/api/"); // Test line 78 (startsWithSlash false)
    });

    it("should handle edge cases mentioned in requirements", () => {
      // Cases: ("/", "/"), ("a", "/b"), ("/a", "b"), ("//a", "b/")
      expect(joinPathnames("/", "/")).toBe("/");
      expect(joinPathnames("a", "/b")).toBe("/a/b");
      expect(joinPathnames("/a", "b")).toBe("/a/b");
      expect(joinPathnames("//a", "b/")).toBe("/a/b/");
    });
  });
});
