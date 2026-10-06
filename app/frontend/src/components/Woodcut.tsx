import { useEffect, useState } from "react";
import type { ChroniclePage } from "../simulation/chronicle";
import type { RuntimeConfig } from "../lib/operations";

type Plate = {
  status: "idle" | "queued" | "working" | "ready" | "failed" | "limited";
  imageUrl?: string;
  message?: string;
};
const jobs = new Map<string, Promise<Plate>>();

async function readPlate(
  config: RuntimeConfig,
  id: string,
  allowMissing = false,
): Promise<Plate> {
  for (let i = 0; i < 70; i++) {
    const check = await fetch(`${config.apiBaseUrl}/illustrations/${id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (allowMissing && check.status === 404) return { status: "idle" };
    if (!check.ok)
      throw new Error(
        "The illustration could not be checked. Reopen this page to check it again.",
      );
    const result = await check.json();
    if (result.status === "ready") {
      if (!/^\/illustrations\/[a-f0-9]{64}\.png$/.test(result.imageUrl))
        throw new Error("The illustration address could not be verified.");
      return { status: "ready", imageUrl: result.imageUrl };
    }
    if (result.status === "failed")
      throw new Error(
        "The illustrator could not finish this plate. The diary remains complete.",
      );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(
    "The ink is taking longer than expected. Reopen this page to check the plate.",
  );
}

function failedPlate(error: unknown): Plate {
  return {
    status: "failed",
    message:
      error instanceof Error
        ? error.message
        : "The illustrator is unavailable.",
  };
}

async function recallPlate(
  config: RuntimeConfig,
  editionId: string,
  page: ChroniclePage,
): Promise<Plate> {
  const key = `${editionId}:${page.colony.day}`;
  if (jobs.has(key)) return jobs.get(key)!;
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`woodcut-v1:${editionId}:${page.colony.day}`),
    );
    const id = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    return await readPlate(config, id, true);
  } catch (error) {
    return failedPlate(error);
  }
}

async function commission(
  config: RuntimeConfig,
  editionId: string,
  page: ChroniclePage,
): Promise<Plate> {
  const key = `${editionId}:${page.colony.day}`;
  if (jobs.has(key)) return jobs.get(key)!;
  const request = (async () => {
    const response = await fetch(`${config.apiBaseUrl}/illustrations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ editionId, choices: page.choices }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.json();
    if (response.status === 429)
      return {
        status: "limited",
        message:
          "The illustrator's allowance is spent for now. Your story and game are saved; try again later.",
      } as Plate;
    if (!response.ok || !/^[a-f0-9]{64}$/.test(body.id))
      throw new Error(
        "The illustrator is unavailable. Your diary and game are safely recorded.",
      );
    return readPlate(config, body.id);
  })().catch(failedPlate);
  jobs.set(key, request);
  const result = await request;
  if (result.status !== "ready") jobs.delete(key);
  return result;
}

export default function Woodcut({
  page,
  editionId,
  config,
  caption,
  automatic,
}: {
  page: ChroniclePage;
  editionId: string;
  config: RuntimeConfig;
  caption: string;
  automatic: boolean;
}) {
  const [plate, setPlate] = useState<Plate>({ status: "idle" });
  const [requested, setRequested] = useState(0);
  const opening = !page.outcome;
  useEffect(() => {
    if (opening || !config.apiBaseUrl || !config.illustrationsEnabled) return;
    let active = true;
    const task =
      automatic || requested
        ? commission(config, editionId, page)
        : recallPlate(config, editionId, page);
    void task.then((result) => {
      if (active) setPlate(result);
    });
    return () => {
      active = false;
    };
  }, [page, editionId, config, opening, automatic, requested]);
  const pending =
    plate.status === "idle" &&
    (automatic || requested) &&
    config.illustrationsEnabled &&
    !!config.apiBaseUrl;
  return (
    <figure className="woodcut-plate">
      {opening ? (
        <img
          src={`${import.meta.env.BASE_URL}woodcuts/frontispiece.png`}
          alt="Woodcut of Captain Mara Venn recording the settlement's first account, with the valley and timber houses beyond."
          width="1536"
          height="1024"
        />
      ) : plate.status === "ready" ? (
        <img
          src={plate.imageUrl}
          alt={`Woodcut illustration for day ${page.colony.day}: ${caption}`}
          width="1536"
          height="1024"
          onError={() =>
            setPlate({
              status: "failed",
              message:
                "This plate could not be loaded. The diary is still available.",
            })
          }
        />
      ) : (
        <div
          className={`woodcut-wait ${pending ? "inking" : ""}`}
          role="status"
        >
          <span className="printing-mark" aria-hidden="true">
            ✦
          </span>
          <strong>
            {pending
              ? "The ink is drying…"
              : plate.status === "limited"
                ? "The press rests for now"
                : plate.status === "failed"
                  ? "A plate yet unfinished"
                  : "An illustration awaits"}
          </strong>
          <p>
            {pending
              ? "A new woodcut is being drawn from this day's account. You may keep reading while the illustrator works."
              : plate.message ||
                (config.illustrationsEnabled
                  ? "Commission a fresh woodcut for this recorded day."
                  : "Fresh turn illustrations are available in the connected AWS edition.")}
          </p>
          {!pending &&
            plate.status !== "failed" &&
            config.illustrationsEnabled && (
              <button
                className="book-link"
                onClick={() => {
                  setPlate({ status: "idle" });
                  setRequested((value) => value + 1);
                }}
              >
                Commission this plate
              </button>
            )}
        </div>
      )}
      <figcaption>
        <span>PLATE {String(page.colony.day - 11).padStart(2, "0")}</span>{" "}
        {caption}
      </figcaption>
    </figure>
  );
}
