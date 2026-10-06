export type RuntimeConfig = {
  apiBaseUrl: string;
  illustrationsEnabled?: boolean;
};
export type Probe = {
  id: string;
  timestamp: string;
  durationMs: number;
  status: number;
  ok: boolean;
  diagnostic: boolean;
  source: "browser" | "aws" | "local-api";
  message: string;
};
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}runtime-config.json`,
    { cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "Runtime configuration is unavailable. The colony still works locally.",
    );
  const config = await response.json();
  const url = config.apiBaseUrl;
  if (
    typeof url !== "string" ||
    (url !== "" &&
      url !== "/api" &&
      !/^https:\/\/[a-z0-9-]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/api$/.test(
        url,
      ))
  )
    throw new Error(
      "Runtime configuration is invalid. The colony still works locally.",
    );
  return {
    apiBaseUrl: url,
    illustrationsEnabled: config.illustrationsEnabled === true,
  };
}
export async function runProbe(
  config: RuntimeConfig,
  diagnostic: boolean,
): Promise<Probe> {
  const start = performance.now();
  let id = crypto.randomUUID() as string;
  let status: number;
  let source: Probe["source"] = "browser";
  let message: string;
  if (!config.apiBaseUrl) {
    status = diagnostic ? 503 : 200;
    message = diagnostic
      ? "Controlled failure simulated in this browser. No cloud request was sent."
      : "The browser demo is responding. No AWS backend is connected.";
  } else {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/${diagnostic ? "diagnostic" : "status"}`,
        {
          method: diagnostic ? "POST" : "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        },
      );
      status = response.status;
      const body = await response.json();
      if (
        !["aws", "local-api"].includes(body.source) ||
        typeof body.requestId !== "string"
      )
        throw new Error("Unexpected API response");
      source = body.source;
      id = body.requestId;
      message =
        typeof body.message === "string"
          ? body.message
          : "API response received.";
    } catch {
      source =
        config.apiBaseUrl === "/api" && location.hostname === "127.0.0.1"
          ? "local-api"
          : "aws";
      status = 0;
      message =
        "The configured API could not be reached or returned an invalid response. Colony state is unchanged.";
    }
  }
  return {
    id,
    timestamp: new Date().toISOString(),
    durationMs: Math.round((performance.now() - start) * 10) / 10,
    status,
    ok: status >= 200 && status < 300,
    diagnostic,
    source,
    message,
  };
}
