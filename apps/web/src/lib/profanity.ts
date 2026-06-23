import { Profanity } from "@2toad/profanity";

export const profanity = new Profanity({
	languages: ["en", "es"],
});

/**
 * Retorna true si el texto contiene palabras ofensivas o insultos (en inglés o español).
 */
export function hasProfanity(text: string): boolean {
	if (!text) return false;
	return profanity.exists(text);
}
