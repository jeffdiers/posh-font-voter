import { Suspense } from "react";

import EventView from "@/components/event/EventView";

function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  );
}

export default function EventPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EventView />
    </Suspense>
  );
}
