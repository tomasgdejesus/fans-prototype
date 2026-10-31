import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { useIsFetching } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet, useNavigation } from "react-router";

export default function AppLayout() {
  const navigation = useNavigation();
  const initialRequests = useIsFetching({
    // Ignore cached-data refreshes and prefetches with no mounted consumers.
    predicate: (query) => query.getObserversCount() > 0 && query.state.data === undefined,
  });
  const pending = navigation.state !== "idle" || initialRequests > 0;

  useEffect(() => {
    if (!pending) return;
    let started = false;
    // Fast navigations need no indicator. This does not delay the navigation.
    const timer = window.setTimeout(() => {
      nprogress.start();
      started = true;
    }, 150);

    return () => {
      window.clearTimeout(timer);
      if (started) nprogress.complete();
    };
  }, [pending]);

  return <>
    <NavigationProgress size={3} />
    <Outlet />
  </>;
}
