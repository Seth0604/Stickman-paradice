
// Local replacements for AI services to run without API keys

const GROUNDING_REASONS = [
  "He tried to eat soup with a fork.",
  "He looked at the sun too long.",
  "He forgot how to walk.",
  "He tried to sell ice to a snowman.",
  "He asked 'Why?' too many times.",
  "He didn't eat his vegetables.",
  "He put ketchup on his ice cream.",
  "He tried to walk through a wall.",
  "He made a face at the neighbor.",
  "He refused to sleep in a bed.",
  "He tried to hug a cactus.",
  "He told the toaster a secret.",
  "He wore his shoes on his hands.",
  "He tried to teach a rock to read.",
  "He stood too still."
];

const THOUGHTS = [
  "Is this real life?",
  "I want more ice cream.",
  "Why is the sky blue?",
  "Walking is hard.",
  "I need a nap.",
  "Where is my house?",
  "Pixels are tasty.",
  "I feel 3D today.",
  "What is a stickman?",
  "Grounding is just a state of mind.",
  "I wonder if the player is watching.",
  "Do I have fingers?",
  "Nice weather for polygons.",
  "I am hungry.",
  "Zzz..."
];

export const getGroundingReason = async (): Promise<string> => {
  return GROUNDING_REASONS[Math.floor(Math.random() * GROUNDING_REASONS.length)];
};

export const getStickmanThought = async (action: string): Promise<string> => {
   return THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
}
