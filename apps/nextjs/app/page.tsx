import { listNotes, serverTime } from "~/app/actions";
import { Notes } from "./components";

// D1 only exists at request time, so the notebook opts out of prerendering.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [notes, time] = await Promise.all([listNotes(), serverTime()]);

  return (
    <main className="h-full">
      <Notes notes={notes} time={time} />
    </main>
  );
}
