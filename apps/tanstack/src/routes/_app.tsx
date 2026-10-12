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
        <a
          href="https://github.com/heyleydotdev/cf-monorepo"
          className="hover:bg-border/50 ml-3 flex items-center gap-2 rounded-full border px-3 py-1 text-[0.8rem]/6 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 fill-yellow-500 text-yellow-500"
          >
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
          </svg>
          Star on Github
        </a>
      </Header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
