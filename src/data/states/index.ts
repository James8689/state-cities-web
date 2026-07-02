import type { StateBundle, StateMeta } from "../../types/quiz";
import { STATE_CONFIGS } from "./registry";
import alabamaMeta from "./alabama.json";
import alaskaMeta from "./alaska.json";
import arizonaMeta from "./arizona.json";
import arkansasMeta from "./arkansas.json";
import californiaMeta from "./california.json";
import coloradoMeta from "./colorado.json";
import connecticutMeta from "./connecticut.json";
import delawareMeta from "./delaware.json";
import floridaMeta from "./florida.json";
import georgiaMeta from "./georgia.json";
import hawaiiMeta from "./hawaii.json";
import idahoMeta from "./idaho.json";
import illinoisMeta from "./illinois.json";
import indianaMeta from "./indiana.json";
import iowaMeta from "./iowa.json";
import kansasMeta from "./kansas.json";
import kentuckyMeta from "./kentucky.json";
import louisianaMeta from "./louisiana.json";
import maineMeta from "./maine.json";
import marylandMeta from "./maryland.json";
import massachusettsMeta from "./massachusetts.json";
import michiganMeta from "./michigan.json";
import minnesotaMeta from "./minnesota.json";
import mississippiMeta from "./mississippi.json";
import missouriMeta from "./missouri.json";
import montanaMeta from "./montana.json";
import nebraskaMeta from "./nebraska.json";
import nevadaMeta from "./nevada.json";
import newHampshireMeta from "./new-hampshire.json";
import newJerseyMeta from "./new-jersey.json";
import newMexicoMeta from "./new-mexico.json";
import newYorkMeta from "./new-york.json";
import northCarolinaMeta from "./north-carolina.json";
import northDakotaMeta from "./north-dakota.json";
import ohioMeta from "./ohio.json";
import oklahomaMeta from "./oklahoma.json";
import oregonMeta from "./oregon.json";
import pennsylvaniaMeta from "./pennsylvania.json";
import rhodeIslandMeta from "./rhode-island.json";
import southCarolinaMeta from "./south-carolina.json";
import southDakotaMeta from "./south-dakota.json";
import tennesseeMeta from "./tennessee.json";
import texasMeta from "./texas.json";
import utahMeta from "./utah.json";
import vermontMeta from "./vermont.json";
import virginiaMeta from "./virginia.json";
import washingtonMeta from "./washington.json";
import westVirginiaMeta from "./west-virginia.json";
import wisconsinMeta from "./wisconsin.json";
import wyomingMeta from "./wyoming.json";

/**
 * Generated metadata JSON, keyed by USPS code. JSON imports must be static for
 * Vite, so each onboarded state adds one line here. (The data itself is
 * produced by `npm run build:data -- XX`.)
 */
const META_BY_USPS: Record<string, StateMeta> = {
  AL: alabamaMeta as StateMeta,
  AK: alaskaMeta as StateMeta,
  AZ: arizonaMeta as StateMeta,
  AR: arkansasMeta as StateMeta,
  CA: californiaMeta as StateMeta,
  CO: coloradoMeta as StateMeta,
  CT: connecticutMeta as StateMeta,
  DE: delawareMeta as StateMeta,
  FL: floridaMeta as StateMeta,
  GA: georgiaMeta as StateMeta,
  HI: hawaiiMeta as StateMeta,
  ID: idahoMeta as StateMeta,
  IL: illinoisMeta as StateMeta,
  IN: indianaMeta as StateMeta,
  IA: iowaMeta as StateMeta,
  KS: kansasMeta as StateMeta,
  KY: kentuckyMeta as StateMeta,
  LA: louisianaMeta as StateMeta,
  ME: maineMeta as StateMeta,
  MD: marylandMeta as StateMeta,
  MA: massachusettsMeta as StateMeta,
  MI: michiganMeta as StateMeta,
  MN: minnesotaMeta as StateMeta,
  MS: mississippiMeta as StateMeta,
  MO: missouriMeta as StateMeta,
  MT: montanaMeta as StateMeta,
  NE: nebraskaMeta as StateMeta,
  NV: nevadaMeta as StateMeta,
  NH: newHampshireMeta as StateMeta,
  NJ: newJerseyMeta as StateMeta,
  NM: newMexicoMeta as StateMeta,
  NY: newYorkMeta as StateMeta,
  NC: northCarolinaMeta as StateMeta,
  ND: northDakotaMeta as StateMeta,
  OH: ohioMeta as StateMeta,
  OK: oklahomaMeta as StateMeta,
  OR: oregonMeta as StateMeta,
  PA: pennsylvaniaMeta as StateMeta,
  RI: rhodeIslandMeta as StateMeta,
  SC: southCarolinaMeta as StateMeta,
  SD: southDakotaMeta as StateMeta,
  TN: tennesseeMeta as StateMeta,
  TX: texasMeta as StateMeta,
  UT: utahMeta as StateMeta,
  VT: vermontMeta as StateMeta,
  VA: virginiaMeta as StateMeta,
  WA: washingtonMeta as StateMeta,
  WV: westVirginiaMeta as StateMeta,
  WI: wisconsinMeta as StateMeta,
  WY: wyomingMeta as StateMeta,
};

/** Available, fully-built states (config + generated metadata + peaks). */
export const STATES: StateBundle[] = STATE_CONFIGS.filter((c) => META_BY_USPS[c.usps]).map((c) => ({
  meta: META_BY_USPS[c.usps],
  peaks: c.peaks,
}));

export const DEFAULT_STATE: StateBundle = STATES[0];

export function getStateBundle(usps: string): StateBundle | undefined {
  if (typeof usps !== "string") return undefined;
  return STATES.find((s) => s.meta.id === usps.toUpperCase());
}
