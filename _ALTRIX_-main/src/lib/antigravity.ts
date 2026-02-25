export type Tone =
  | "Neutral"
  | "Polite"
  | "Empathetic"
  | "Assertive"
  | "Friendly"
  | "Formal";

export type Audience =
  | "Student"
  | "Professional"
  | "General Reader"
  | "Expert";

export type Formality = "Low" | "Medium" | "High";

export interface AntiGravityOutput {
  humanizedText: string;
  analysis: {
    intent: string;
    tone: string;
    audience: string;
    formality: string;
  };
  explainability: {
    intentPreservation: string;
    toneAdjustments: string;
    stylisticChanges: string;
    humanizationTechniques: string;
  };
}

export async function processText(input: {
  text: string;
  tone: Tone;
  audience: Audience;
  formality: Formality;
}): Promise<AntiGravityOutput> {
  const res = await fetch("/api/humanize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to process text");
  }

  return {
    humanizedText: data.humanizedText,
    analysis: {
      intent: "Informative",
      tone: input.tone,
      audience: input.audience,
      formality: input.formality,
    },
    explainability: {
      intentPreservation:
        "Original intent preserved while improving clarity.",
      toneAdjustments:
        "Tone adjusted based on user selection.",
      stylisticChanges:
        "Improved sentence flow and readability.",
      humanizationTechniques:
        "Natural phrasing and conversational patterns applied.",
    },
  };
}
