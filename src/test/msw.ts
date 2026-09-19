import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import { apiHandlers, resetMockApi } from "./handlers";

export const msw = setupServer(...apiHandlers);

beforeAll(() => msw.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  resetMockApi();
  msw.resetHandlers();
});
afterAll(() => msw.close());
