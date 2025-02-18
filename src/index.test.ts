import { describe, it, expect } from "vitest";
import { transform } from "./index";

describe("URL Transformer", () => {
  // Helper function to create a base URL for testing
  const createBaseURL = () =>
    new URL("https://user:pass@example.com:8080/path?q=123#hash");

  describe("origin input", () => {
    it("should update urls", () => {
      const nextURL = transform(
        {
          pathname: "/next-page",
          hash: "",
          searchParams: { set: { foo: "bar" }, unset: ["baz"] },
        },
        new URL("https://example.com:8080/path?baz=1#hash")
      );
      expect(nextURL.href).toMatchInlineSnapshot(
        `"https://example.com:8080/next-page?foo=bar"`
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
        const result = transform(input, createBaseURL());
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
        const result = transform(input, createBaseURL());
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
        const result = transform(input, createBaseURL());
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
        const result = transform(input, createBaseURL());
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
        const result = transform(input, createBaseURL());
        expect(result.href).toBe(expected);
      });
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
      ];

      cases.forEach(({ input, expected }) => {
        const result = transform(input, createBaseURL());
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
        const result = transform(input, createBaseURL());
        expect(result.href).toBe(expected);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty port strings", () => {
      const result = transform(
        {
          hostname: "example.com",
          port: "",
          username: "",
          password: "",
        },
        createBaseURL()
      );
      expect(result.href).toBe("https://example.com/path?q=123#hash");
    });

    it("should preserve existing values when not specified", () => {
      const result = transform(
        {
          protocol: "http:",
          username: "",
          password: "",
        },
        createBaseURL()
      );
      expect(result.href).toBe("http://example.com:8080/path?q=123#hash");
    });
  });
});
