import { createFileRoute } from "@tanstack/react-router";
import { ShiftCalendar } from "../components/ShiftCalendar";

export const Route = createFileRoute("/")({
  component: () => <ShiftCalendar />,
});
