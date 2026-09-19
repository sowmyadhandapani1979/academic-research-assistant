import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import { LibraryProvider } from "../store/LibraryContext";

export function renderApp(path = "/") {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(
    <LibraryProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </LibraryProvider>,
  );
  return { user, ...view };
}

export type { RenderOptions };
