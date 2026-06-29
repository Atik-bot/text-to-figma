import { DesignSchema } from "./types";
import { loadFonts } from "./components";
import { buildPage } from "./builder";

// Shows the UI panel (ui.html) with a fixed size when the plugin starts.
figma.showUI(__html__, { width: 420, height: 480 });

// Listens for messages sent from ui.html via parent.postMessage.
// This is the only communication channel between the two plugin worlds.
figma.ui.onmessage = async (msg: { type: string; payload?: unknown }) => {
  if (msg.type === "generate") {
    try {
      const schema = msg.payload as DesignSchema;

      await loadFonts();
      const pageFrame = buildPage(schema);

      // Move the viewport to show the newly created frame, and select it,
      // so the user immediately sees the result without scrolling to find it.
      figma.currentPage.selection = [pageFrame];
      figma.viewport.scrollAndZoomIntoView([pageFrame]);

      figma.ui.postMessage({ type: "success" });
    } catch (error) {
      // Send the error back to the UI so it's visible to the user,
      // instead of failing silently inside the sandbox console.
      const message = error instanceof Error ? error.message : String(error);
      figma.ui.postMessage({ type: "error", message });
    }
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
