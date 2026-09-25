import type { PuzzleData } from "../../lib/puzzle/types";

/**
 * The ten easy puzzles scheduled from `LAUNCH_DATE`, one per consecutive day.
 * Every group has four words and every puzzle has 16 unique words; this is
 * enforced by `lib/puzzle/schema.ts` (and by a test) before seeding.
 */
export const seedPuzzles: PuzzleData[] = [
  {
    groups: [
      { difficulty: 1, name: "Frukt", words: ["eple", "banan", "pære", "appelsin"] },
      { difficulty: 2, name: "Verktøy", words: ["hammer", "sag", "tang", "meisel"] },
      { difficulty: 3, name: "Hovedsteder", words: ["london", "paris", "rom", "madrid"] },
      { difficulty: 4, name: "Farger", words: ["rød", "blå", "grønn", "gul"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Husdyr", words: ["hund", "katt", "hest", "kanin"] },
      { difficulty: 2, name: "Bilmerker", words: ["volvo", "toyota", "ford", "tesla"] },
      { difficulty: 3, name: "Årstider", words: ["vår", "sommer", "høst", "vinter"] },
      { difficulty: 4, name: "Instrumenter", words: ["gitar", "piano", "trommer", "fiolin"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Planeter", words: ["mars", "venus", "jupiter", "saturn"] },
      { difficulty: 2, name: "Bestikk", words: ["kniv", "gaffel", "skje", "teskje"] },
      { difficulty: 3, name: "Idretter", words: ["fotball", "tennis", "svømming", "sykling"] },
      { difficulty: 4, name: "Klær", words: ["genser", "bukse", "jakke", "skjorte"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Fisk", words: ["laks", "torsk", "sei", "ørret"] },
      { difficulty: 2, name: "Norske byer", words: ["bergen", "trondheim", "stavanger", "drammen"] },
      { difficulty: 3, name: "Vær", words: ["regn", "snø", "sol", "vind"] },
      { difficulty: 4, name: "Trær", words: ["bjørk", "furu", "gran", "eik"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Sjømat", words: ["reker", "krabbe", "blåskjell", "hummer"] },
      { difficulty: 2, name: "Krydder", words: ["salt", "pepper", "kanel", "oregano"] },
      { difficulty: 3, name: "Møbler", words: ["stol", "bord", "sofa", "seng"] },
      { difficulty: 4, name: "Kroppsdeler", words: ["hode", "arm", "ben", "fot"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Drikke", words: ["vann", "kaffe", "te", "juice"] },
      { difficulty: 2, name: "Tallord", words: ["en", "to", "tre", "fire"] },
      { difficulty: 3, name: "Land", words: ["norge", "sverige", "danmark", "finland"] },
      { difficulty: 4, name: "Insekter", words: ["maur", "bie", "flue", "veps"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Steintyper", words: ["granitt", "marmor", "skifer", "kalkstein"] },
      { difficulty: 2, name: "Romertall", words: ["I", "V", "X", "L"] },
      { difficulty: 3, name: "Musikk", words: ["melodi", "rytme", "harmoni", "akkord"] },
      { difficulty: 4, name: "Kjøretøy", words: ["bil", "buss", "tog", "trikk"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Blomster", words: ["rose", "tulipan", "solsikke", "nellik"] },
      { difficulty: 2, name: "Verktøy", words: ["skrutrekker", "vater", "tang", "hammer"] },
      { difficulty: 3, name: "Grønnsaker", words: ["gulrot", "potet", "løk", "brokkoli"] },
      { difficulty: 4, name: "Hav", words: ["atlanterhavet", "stillehavet", "indiskehav", "ishavet"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Dyr i Afrika", words: ["løve", "elefant", "sjiraff", "sebra"] },
      { difficulty: 2, name: "Fotballag", words: ["arsenal", "chelsea", "liverpool", "everton"] },
      { difficulty: 3, name: "Yrker", words: ["lege", "lærer", "baker", "politi"] },
      { difficulty: 4, name: "Bakverk", words: ["bolle", "kjeks", "muffins", "vafler"] },
    ],
  },
  {
    groups: [
      { difficulty: 1, name: "Nordiske hovedsteder", words: ["københavn", "helsinki", "reykjavik", "stockholm"] },
      { difficulty: 2, name: "Eksotisk frukt", words: ["kiwi", "mango", "ananas", "papaya"] },
      { difficulty: 3, name: "Vintersport", words: ["ski", "skøyter", "aking", "curling"] },
      { difficulty: 4, name: "Farger", words: ["oransje", "lilla", "brun", "svart"] },
    ],
  },
];
