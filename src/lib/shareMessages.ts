import { type ReservoirGrade } from "./reservoir";

const POOP = "💩";
const EYES = "👀";

export const SHARE_MESSAGE_TEMPLATES = [
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You just got hit with a splat! ${POOP} ${s} launched ${u} units at you. See the damage here: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `INCOMING! ${POOP} ${s} just declared war with ${u} units. Retaliate on Pooped: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Not a drill! ${POOP} ${s} hit you with ${u} units. Start your gut streak and launch one back: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You've been chosen! ${POOP} ${s} sent ${u} units your way. See the damage and join the game: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Uh oh ${EYES} ${s} just dropped ${u} units on you. Think you can keep up? Launch back: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You got hit! ${POOP} ${s} sent ${u} units. Don't let them win — get on Pooped and retaliate: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `Surprise! ${POOP} ${s} just pooped ${u} units. See the splat and hit back: ${l}`,
  (s: string, u: number, _g: ReservoirGrade, l: string) => 
    `You've been challenged! ${POOP} ${s} launched ${u} units. Join the fun and launch some back: ${l}`
];

export const getRandomShareText = (params: {
  sender: string;
  units: number;
  grade: ReservoirGrade;
  splatUrl: string;
}) => {
  const idx = Math.floor(Math.random() * SHARE_MESSAGE_TEMPLATES.length);
  return SHARE_MESSAGE_TEMPLATES[idx](params.sender, params.units, params.grade, params.splatUrl);
};
