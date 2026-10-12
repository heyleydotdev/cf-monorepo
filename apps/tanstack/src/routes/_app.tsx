import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Header, HeaderLink, HeaderLinks, Logo } from "@acme/ui";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container flex min-h-full flex-col">
      <Header>
        <Logo />
        <HeaderLinks>
          <HeaderLink render={<Link to="/" />}>Home</HeaderLink>
          <HeaderLink render={<Link to="/notes" />}>Notes</HeaderLink>
        </HeaderLinks>
      </Header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
