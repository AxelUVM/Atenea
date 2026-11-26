import {
    assert,
    assertAlmostEquals,
    assertEquals,
    assertRejects,
} from "@std/assert";

import {
    backoffDelayMs,
    buildPrompt,
    isRetryable,
    saveResponse,
    timestampedFilename,
    withRetry,
} from "./main.ts";

Deno.test("buildPrompt joins args with spaces", () => {
    assertEquals(buildPrompt(["write", "a", "haiku"]), "write a haiku");
});

Deno.test("buildPrompt falls back to the default when no args", () => {
    assertEquals(buildPrompt([], "default prompt"), "default prompt");
});

Deno.test("isRetryable: true for 429 and 5xx", () => {
    assert(isRetryable({ status: 429 }));
    assert(isRetryable({ status: 500 }));
    assert(isRetryable({ status: 503 }));
});

Deno.test("isRetryable: false for client errors and non-errors", () => {
    assertEquals(isRetryable({ status: 400 }), false);
    assertEquals(isRetryable({ status: 403 }), false);
    assertEquals(isRetryable(new Error("boom")), false); // no status property
    assertEquals(isRetryable(null), false);
    assertEquals(isRetryable("a string"), false);
});

Deno.test("backoffDelayMs doubles each attempt (jitter pinned to 0)", () => {
    assertEquals(backoffDelayMs(1, 0), 1000);
    assertEquals(backoffDelayMs(2, 0), 2000);
    assertEquals(backoffDelayMs(3, 0), 4000);
});

Deno.test("backoffDelayMs adds jitter on top", () => {
    assertEquals(backoffDelayMs(1, 250), 1250);
});

Deno.test("backoffDelayMs default jitter stays within 0-500ms", () => {
    const delay = backoffDelayMs(1);
    assert(delay >= 1000 && delay < 1500);
});

Deno.test("timestampedFilename has no colons and ends in .json", () => {
    const name = timestampedFilename(new Date("2026-11-26T12:34:56.789Z"));
    assertEquals(name, "2026-11-26T12-34-56.789Z.json");
});

function apiError(status: number): Error & { status: number } {
    return Object.assign(new Error(`HTTP ${status}`), { status });
}

Deno.test("withRetry returns immediately on success", async () => {
    let calls = 0;
    const result = await withRetry(() => {
        calls++;
        return Promise.resolve("ok");
    });
    assertEquals(result, "ok");
    assertEquals(calls, 1);
});

Deno.test("withRetry retries 503 then succeeds", async () => {
    let calls = 0;
    const sleeps: number[] = [];

    const result = await withRetry(
        () => {
            calls++;
            return calls < 3 ? Promise.reject(apiError(503)) : Promise.resolve("finally");
        },
        {
            sleep: (ms) => {
            sleeps.push(ms);
            return Promise.resolve();
        },
    },
    );

    assertEquals(result, "finally");
    assertEquals(calls, 3);
    assertEquals(sleeps.length, 2);
    assertAlmostEquals(sleeps[0], 1250, 250);
    assertAlmostEquals(sleeps[1], 2250, 250);
});

Deno.test("withRetry does not retry non-retryable errors", async () => {
    let calls = 0;
    await assertRejects(
        () => {
            calls++;
            return withRetry(() => Promise.reject(apiError(403)), {
                sleep: () => Promise.resolve(),
            });
        },
        Error,
        "HTTP 403",
    );
    assertEquals(calls, 1);
});

Deno.test("withRetry gives up after maxAttempts", async () => {
    let calls = 0;
    await assertRejects(
        () =>
            withRetry(
                () => {
                    calls++;
                    return Promise.reject(apiError(503));
                },
            { maxAttempts: 3, sleep: () => Promise.resolve() },
        ),
        Error,
        "HTTP 503",
    );
    assertEquals(calls, 3);
});

Deno.test("withRetry calls onRetry with attempt number", async () => {
    const attemptsSeen: number[] = [];
    let calls = 0;
    await withRetry(
        () => {
            calls++;
            return calls < 2 ? Promise.reject(apiError(500)) : Promise.resolve("done");
        },
        {
            sleep: () => Promise.resolve(),
            onRetry: (attempt) => attemptsSeen.push(attempt),
        },
    );
    assertEquals(attemptsSeen, [1]);
});

Deno.test("saveResponse writes JSON we can read back", async () => {
    const dir = await Deno.makeTempDir();
    try {
        const data = { model: "test-model", prompt: "hi", text: "hello" };
        const path = await saveResponse(
            dir,
            data,
            new Date("2026-01-02T03:04:05.000Z"),
        );

        assertEquals(path, `${dir}/2026-01-02T03-04-05.000Z.json`);

        const saved = JSON.parse(await Deno.readTextFile(path));
        assertEquals(saved, data);
    } finally {
        await Deno.remove(dir, { recursive: true });
    }
});

Deno.test("saveResponse creates the directory if missing", async () => {
    const base = await Deno.makeTempDir();
    try {
        const nested = `${base}/does/not/exist/yet`;
        const path = await saveResponse(nested, {
            model: "m",
            prompt: "p",
            text: "t",
        });
        assert((await Deno.stat(path)).isFile);
    } finally {
        await Deno.remove(base, { recursive: true });
    }
});
