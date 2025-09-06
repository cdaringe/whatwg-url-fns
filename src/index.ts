type URLBuilderCommon<
  SearchParams extends Record<string, any> = Record<string, any>,
> = {
  pathname?: string | { append: string };
  hash?: string;
  username?: string;
  password?: string;
  searchParams?:
    | {
        clear?: boolean;
        set?: Partial<SearchParams>;
        unset?: (keyof SearchParams)[];
      }
    | URLSearchParams;
};

type URLBuilderOriginOriginMode = URLBuilderCommon & {
  origin: string; // proto + hostname + port
};

type URLBuilderOriginHostMode = URLBuilderCommon & {
  protocol?: string;
  host: string; // hostname + port
};

type URLBuilderOriginProtocolHostnameMode = URLBuilderCommon & {
  protocol?: string;
  hostname: string;
  port?: string;
};

type URLBuilderOriginHostnamelessMode = URLBuilderCommon & {
  protocol?: string;
  port?: string;
};

/**
 * URLs are composites of multiple parts. We also have
 * terms for composite subparts. For example, `host` is
 * `hostname + port`, while `origin` is `proto + hostname + port`.
 * All of these are valueable and good DX to use dependent
 * on cirmcumstance. However, offering an API accepting
 * both `port` and `origin` simultaneously allows unreconcilable states,
 * as there is no clear output for `port`.
 * Thus, we make conflicting inputs unrepresentable by unioning
 * out all of the feasible inputs.
 */
type URLBuilderInput =
  | URLBuilderOriginOriginMode
  | URLBuilderOriginHostMode
  | URLBuilderOriginProtocolHostnameMode
  | URLBuilderOriginHostnamelessMode;

export const getUnPwPart = (un?: string, pw?: string): string => {
  if (!un) return "";
  return `${[un, pw].filter(Boolean).join(":")}@`;
};

export const transform = (
  currentURLInput: URL | string,
  options: URLBuilderInput,
): URL => {
  const currentURL =
    typeof currentURLInput === "string"
      ? new URL(currentURLInput)
      : currentURLInput;
  const nextUrlParts = {
    // directly update fields
    hash: isEmpty(options.hash)
      ? currentURL.hash
      : options.hash
        ? `#${options.hash}`
        : "",
    pathname: prefixSlash(
      typeof options.pathname === "object" && "append" in options.pathname
        ? joinPathnames(currentURL.pathname, options.pathname.append)
        : (options.pathname ?? currentURL.pathname),
    ),
    password: options.password ?? currentURL.password,
    username: options.username ?? currentURL.username,

    // these fields are updated by our origin
    // discrimnator handling
    hostname: currentURL.hostname,
    protocol: currentURL.protocol,
    port: currentURL.port,
  };

  const updateHostnameAndPortFromHostField = (host: string) => {
    const [hostname, port] = host.split(":");
    if (hostname) nextUrlParts.hostname = hostname;
    if (port && port.length) nextUrlParts.port = port;
  };

  const applyProtoAndPort = <I extends { protocol?: string; port?: string }>(
    input: I,
  ) => {
    (["protocol", "port"] as const).forEach((fieldName) => {
      if (input[fieldName] != null) nextUrlParts[fieldName] = input[fieldName];
    });
  };

  // case: handle protocol + hostname + port updates
  if ("origin" in options) {
    // case: URLBuilderOriginOriginMode
    const [protocol, host] = options.origin.split("//");
    nextUrlParts.protocol = protocol!;
    updateHostnameAndPortFromHostField(host!);
  } else if ("host" in options) {
    // case: URLBuilderOriginHostMode
    if (options.protocol) nextUrlParts.protocol = options.protocol;
    updateHostnameAndPortFromHostField(options.host);
  } else if ("hostname" in options) {
    // case: URLBuilderOriginProtocolHostnameMode
    nextUrlParts.hostname = options.hostname;
    applyProtoAndPort(options);
  } else {
    // case: URLBuilderOriginHostnamelessMode;
    applyProtoAndPort(options);
  }

  // Handle username/password
  const unPwPart = getUnPwPart(nextUrlParts.username, nextUrlParts.password);

  // Construct the URL
  const assembledBaseURLString = [
    nextUrlParts.protocol,
    "//",
    unPwPart,
    nextUrlParts.hostname,
    nextUrlParts.port ? `:${nextUrlParts.port}` : "",
    nextUrlParts.pathname, // ensure leading slash
    currentURL.search, // fear not, we'll update this momentarily
    nextUrlParts.hash,
  ].join("");
  const nextURL = new URL(assembledBaseURLString);

  // Handle search params if provided
  const optionsParams = options.searchParams;
  if (optionsParams) {
    if ("clear" in optionsParams && optionsParams.clear) {
      nextURL.search = "";
    }
    Object.entries(optionsParams.set ?? {}).forEach(([key, value]) => {
      nextURL.searchParams.set(key, value);
    });
    (("unset" in optionsParams && optionsParams.unset) || []).forEach((key) => {
      nextURL.searchParams.delete(String(key));
    });
  }

  return nextURL;
};

export const joinPathnames = (base: string, append: string): string => {
  const _joinPathnames = () => {
    if (!append) return base;
    if (!base) return append;
    const cleanBase = base.replace(/\/+$/, "").replace(/^\/+/, "");
    const cleanAppend = append.replace(/^\/+/, "");
    return [cleanBase, cleanAppend].filter(Boolean).join("/");
  };
  return prefixSlash(_joinPathnames());
};

const prefixSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

export function isEmpty<T>(x: T): x is T & ([] | {} | "") {
  return x == null;
}
