import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SeaStudio } from "@/components/SeaStudio";

export const Route = createFileRoute("/sea-studio")({
  head: () => ({
    meta: [
      { title: "استوديو البحر — عرش البحار" },
      { name: "description", content: "اضبط أمواج البحر والزبد واللمعان ومكان سفنك على أي خلفية." },
      { property: "og:title", content: "استوديو البحر — عرش البحار" },
      { property: "og:description", content: "محرّر بحر احترافي لكل قبطان: خلفيات وأمواج وسفن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <main className="social-page" dir="rtl">
      <div className="social-wrap">
        <header className="social-titlebar"><Link to="/" className="icon-control" aria-label="رجوع"><ArrowRight /></Link><div><span>لكل قبطان</span><h1>استوديو البحر</h1></div></header>
        <SeaStudio />
      </div>
    </main>
  ),
});
