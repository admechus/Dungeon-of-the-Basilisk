import { Language } from '../types';
import { FLAVOR_DB } from '../dictionary';

// OFFLINE MODE SERVICE
// Replaces external API calls with local random strings to ensure
// the game works without internet or API keys.

export const generateGameEvent = async (
  language: Language,
  playerName: string,
  isCenter: boolean
): Promise<string> => {
  // Simulate network delay for effect (optional, keep it fast for local)
  await new Promise(resolve => setTimeout(resolve, 300));

  const db = FLAVOR_DB[language];
  let text = "";

  if (isCenter) {
    const randomIndex = Math.floor(Math.random() * db.boss_intros.length);
    text = db.boss_intros[randomIndex];
  } else {
    const randomIndex = Math.floor(Math.random() * db.encounters.length);
    text = db.encounters[randomIndex];
  }

  // Simple customization
  return `${playerName}... ${text}`;
};