import { type ReservoirGrade } from "./reservoir";

// Using Unicode escapes for emojis to prevent rendering issues in share interfaces
const POOP = "\uD83D\uDCA9";
const EYES = "\uD83D\uDC40";

export const SHARE_MESSAGE_TEMPLATES = [
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `${n}, you've been pooped on ${POOP} ${s} launched ${u} units of ${g}-grade damage. Can you beat that? → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `INCOMING ${n} ${POOP} ${s} just declared war with ${u} units of ${g}-grade damage. The damage is done. → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `This is not a drill, ${n}. ${s} hit you with ${u} units of ${g}-grade power. Your move. → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `${n} has been chosen. ${s} selected you personally for ${u} units of ${g}-grade destruction. → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `Uh oh ${n} ${EYES} ${s} is ${u} units of ${g}-grade damage deep and coming for you. Think you can keep up? → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `${s} vs ${n}. Current score: ${u} units of ${g}-grade damage to zero. Don't let them win. → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `Respectfully ${n}... ${s} just pooped ${u} units of ${g}-grade damage and put your name on it. → ${l}`,
  (n: string, s: string, u: number, g: ReservoirGrade, l: string) => 
    `You have been poop-challenged, ${n}. ${s} is at ${u} units of ${g}-grade damage. Accept or stay scared. → ${l}`
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
