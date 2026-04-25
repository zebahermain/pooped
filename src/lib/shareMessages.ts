import { type ReservoirGrade } from "./reservoir";

const POOP = "💩";
const EYES = "👀";

export const SHARE_MESSAGE_TEMPLATES = [
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `${n}, you just got pooped on! ${POOP} ${s} launched ${u} poop units at you. See the splat and hit back on Pooped: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `INCOMING! ${POOP} ${s} just declared war with ${u} poop units, ${n}. Join the fun on Pooped and retaliate: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Not a drill, ${n}! ${POOP} ${s} hit you with ${u} poop units. Start your gut streak on Pooped and launch one back: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You've been chosen! ${POOP} ${s} sent ${u} poop units your way. See the damage and join the game on Pooped: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Uh oh ${n} ${EYES} ${s} just dropped ${u} poop units on you. Think you can keep up? Launch back on Pooped: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `${s} vs ${n}! ${POOP} The score is ${u} poop units to 0. Don't let them win — get on Pooped and retaliate now: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Surprise, ${n}! ${POOP} ${s} just pooped ${u} poop units and put your name on it. See the splat and hit back on Pooped: ${l}`,
  (n: string, s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You've been poop-challenged, ${n}! ${POOP} ${s} is at ${u} poop units. Join the fun and launch some back: ${l}`
];

export const getRandomShareText = (params: {
  recipient: string;
  sender: string;
  units: number;
  grade: ReservoirGrade;
  splatUrl: string;
}) => {
  const idx = Math.floor(Math.random() * SHARE_MESSAGE_TEMPLATES.length);
  return SHARE_MESSAGE_TEMPLATES[idx](params.recipient, params.sender, params.units, params.grade, params.splatUrl);
};
