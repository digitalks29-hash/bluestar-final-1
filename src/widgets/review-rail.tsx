import { createRoot, type Root } from "react-dom/client";
import { TeamLanyardRail, type LanyardMember } from "../components/team-lanyard-rail";

const GOOGLE = "https://share.google/5hVxhh88GMCV5Jvld";

function avatar(name: string, color: string) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="${color}"/><text x="80" y="98" text-anchor="middle" font-family="Sora,sans-serif" font-size="62" font-weight="700" fill="#fdf8e6">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const REVIEWS: LanyardMember[] = [
  {
    id: "kelly",
    name: "Kelly N.",
    role: "5-star Google review",
    team: "Google · Garland",
    image: avatar("Kelly N.", "#4219fa"),
    bio: "Blue Star Janitorial has provided exceptional service consistently since we began using them. Always going above and beyond to ensure we are happy with the outcome.",
    tags: ["5 stars", "Ongoing"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 1,
  },
  {
    id: "samuel",
    name: "Samuel F.",
    role: "5-star Google review",
    team: "Google · DFW",
    image: avatar("Samuel F.", "#1f6feb"),
    bio: "We recently hired BlueStar Janitorial to strip and wax our floors and clean our carpets. The team was very professional and efficient, floors and carpet turned out great!",
    tags: ["Strip & wax", "Carpet"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 2,
  },
  {
    id: "rodd",
    name: "Rodd D.",
    role: "5-star Google review",
    team: "Google · Schools",
    image: avatar("Rodd D.", "#c8962e"),
    bio: "This crew was quick. They did a professional job on 3 school buildings in 1 week. Our floors look outstanding!!!",
    tags: ["Schools", "Floor care"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 3,
  },
  {
    id: "michelle",
    name: "Michelle",
    role: "5-star Google review",
    team: "Google · Retail",
    image: avatar("Michelle", "#0f8a72"),
    bio: "It has been a struggle to find someone to clean the floor under our gondolas… They did in one night what others were not able to do in three nights.",
    tags: ["Retail", "One night"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 4,
  },
  {
    id: "sammy",
    name: "Sammy F.",
    role: "5-star Google review",
    team: "Google · Build-out",
    image: avatar("Sammy F.", "#d4532b"),
    bio: "We hired BlueStar for our construction clean-up, everything included, restrooms, dusting, windows and floors. They went over and beyond and accommodated our scheduling needs.",
    tags: ["Post-construction"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 5,
  },
  {
    id: "wendy",
    name: "Wendy M.",
    role: "5-star Google review",
    team: "Google · Store",
    image: avatar("Wendy M.", "#4219fa"),
    bio: "They got to my store an hour early and then the owner came in and explained what they were going to do. I couldn’t have been more pleased with this crew.",
    tags: ["Owner on site"],
    links: [{ label: "Google", href: GOOGLE }],
    tone: 2,
  },
];

function Reviews() {
  return (
    <TeamLanyardRail
      items={REVIEWS}
      eyebrow="Reviews"
      heading="What clients wrote on Google"
      caption="Real notes from the Bluestar Google profile. Flip a badge to read the full review."
      autoplay
      interval={3200}
      labels={{
        flip: "Click or press Enter to read this review",
        back: "Click again or press Esc to turn the badge back",
        show: "Show",
      }}
      action={
        <a className="bs-google-link" href={GOOGLE} target="_blank" rel="noreferrer">
          Open our Google profile
        </a>
      }
    />
  );
}

const HOST_ID = "bs-review-rail";
let host: HTMLDivElement | null = null;
let root: Root | null = null;
let queued = false;

function place() {
  const anchor = document.getElementById("services");
  if (!anchor?.parentElement) return;
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
  }
  if (host.nextSibling !== anchor) anchor.parentElement.insertBefore(host, anchor);
  if (!root) {
    root = createRoot(host);
    root.render(<Reviews />);
  }
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    place();
  });
}

function boot() {
  place();
  const main = document.getElementById("main") ?? document.body;
  new MutationObserver(schedule).observe(main, { childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
