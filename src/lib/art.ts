import cap1 from "@/assets/captains/cap-1.jpg";
import cap2 from "@/assets/captains/cap-2.jpg";
import cap3 from "@/assets/captains/cap-3.jpg";
import cap4 from "@/assets/captains/cap-4.jpg";
import cap5 from "@/assets/captains/cap-5.jpg";
import cap6 from "@/assets/captains/cap-6.jpg";
import crewSailor from "@/assets/crew/sailor.jpg";
import crewLuck from "@/assets/crew/luck.jpg";
import crewGuide from "@/assets/crew/guide.jpg";
import crewThief from "@/assets/crew/thief.jpg";
import crewGuard from "@/assets/crew/guard.jpg";
import crewFixS from "@/assets/crew/fix-s.jpg";
import crewFixM from "@/assets/crew/fix-m.jpg";
import crewFixL from "@/assets/crew/fix-l.jpg";
import crewFixLegend from "@/assets/crew/fix-legend.jpg";
import sardine from "@/assets/fish/sardine.png";
import mackerel from "@/assets/fish/mackerel.png";
import tuna from "@/assets/fish/tuna.png";
import swordfish from "@/assets/fish/swordfish.png";
import turtle from "@/assets/fish/turtle.png";
import pearl from "@/assets/fish/pearl.png";
import actSail from "@/assets/actions/act-sail.png";
import actCrew from "@/assets/actions/act-crew.png";
import actSell from "@/assets/actions/act-sell.png";

/** Project-owned artwork in one painted style. */
export const CAPTAINS = [cap1, cap2, cap3, cap4, cap5, cap6];
export const CREW_ART = [crewSailor, crewLuck, crewGuide];
/** Crew art keyed by the crew id from items.ts; falls back to the rotation for crews without art yet. */
export const CREW_ART_MAP: Record<string, string> = {
  sailor: crewSailor, luck: crewLuck, guide: crewGuide,
  thief: crewThief, guard: crewGuard, "fix-s": crewFixS, "fix-m": crewFixM, "fix-l": crewFixL, "fix-legend": crewFixLegend,
};
export const FISH_ART = { sardine, mackerel, tuna, swordfish, turtle, pearl };
export const ACTION_ART = { sail: actSail, crew: actCrew, sell: actSell };
