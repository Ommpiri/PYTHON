import { createFileRoute } from "@tanstack/react-router";
import { WhiteboardApp } from "@/components/whiteboard/WhiteboardApp";

export const Route = createFileRoute("/whiteboard")({
  head: () => ({
    meta: [
      { title: "Whiteboard — pycourse Teaching Tool" },
      {
        name: "description",
        content:
          "Full-screen infinite canvas whiteboard for Python teaching — draw, annotate, insert code snippets, and export for screen recordings.",
      },
      { property: "og:title", content: "Whiteboard — pycourse" },
      {
        property: "og:description",
        content:
          "A premium teaching whiteboard with freehand drawing, shapes, code snippets, templates, and export — built for Python instruction.",
      },
    ],
  }),
  component: WhiteboardPage,
});

function WhiteboardPage() {
  return <WhiteboardApp />;
}
