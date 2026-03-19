import { AnalyzerResponse, PortraitSection } from "../interfaces/analyzerInterfaces";

type Nullable<T> = T | null | undefined;

const APP_NAME = "Lovescope";

const toUnicodeBold = (input: string) => {
  return (input ?? "")
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);

      // A-Z
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x1d400 + (code - 65));
      }

      // a-z
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(0x1d41a + (code - 97));
      }

      // 0-9
      if (code >= 48 && code <= 57) {
        return String.fromCodePoint(0x1d7ce + (code - 48));
      }

      return ch;
    })
    .join("");
};

const joinNonEmpty = (parts: Array<Nullable<string>>, separator: string) =>
  parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join(separator);

const asBulletList = (items: Nullable<string[]>) => {
  if (!items || items.length === 0) return "";
  const normalized = items
    .map((i) => (i ?? "").trim())
    .filter((i) => i.length > 0);
  if (normalized.length === 0) return "";
  return normalized.map((i) => `- ${i}`).join("\n");
};

const asSection = (title: string, body: Nullable<string>) => {
  const content = (body ?? "").trim();
  if (!content) return "";
  return `${toUnicodeBold(title)}\n${content}`;
};

const asHeader = (reportTitle: string, subjectLine: string, metaLine?: string) => {
  const subject = (subjectLine ?? "").trim();
  const meta = (metaLine ?? "").trim();
  const headerTitle = joinNonEmpty([APP_NAME, reportTitle], " • ");
  return joinNonEmpty([toUnicodeBold(headerTitle), subject, meta], "\n");
};

const isNonEmptyText = (value: Nullable<string>) => {
  const v = (value ?? "").trim();
  return v.length > 0;
};

const isFlagSection = (title: Nullable<string>) => {
  const t = (title ?? "").trim().toLowerCase();
  if (!t) return false;
  return t === "red flags" || t === "green flags" || t.endsWith(" flags");
};

const normalizeContextText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    const items = value
      .map((v) => (v === null || v === undefined ? "" : String(v)).trim())
      .filter((v) => v.length > 0);
    return items.length > 0 ? items.map((i) => `- ${i}`).join("\n") : "";
  }
  if (typeof value === "string") return value;
  return String(value);
};

export const buildPartnerPortraitShareText = (params: {
  profileName: string;
  age?: number | string | null;
  gender?: string | null;
  relationship?: string | null;
  partnerPersona?: string | null;
  keyInsights?: string[] | null;
  sections?: PortraitSection[] | null;
}) => {
  const subjectLine = params.profileName ? params.profileName.trim() : "";
  const meta = joinNonEmpty(
    [
      params.age !== null && params.age !== undefined ? String(params.age) : "",
      params.gender ?? "",
      params.relationship ?? "",
    ],
    " • "
  );

  const chunks: string[] = [asHeader("Partner Portrait", subjectLine, meta)];

  const insights = asSection("Key Insights", asBulletList(params.keyInsights));
  if (insights) {
    chunks.push(insights);
  }

  let relationshipSignals: string = "";
  if (params.sections && params.sections.length > 0) {
    const sections = params.sections.filter((s) => s && s.title);

    const flagBlocks = sections
      .filter((s) => isFlagSection(s.title))
      .map((s) => {
        const content = normalizeContextText((s as any)?.context).trim();
        if (!isNonEmptyText(content)) return "";
        return `${toUnicodeBold(s.title)}\n${content}`;
      })
      .filter((b) => b.length > 0)
      .join("\n\n");

    relationshipSignals = asSection("Relationship Signals", flagBlocks);
  }

  const persona = asSection("Partner Persona", params.partnerPersona);
  if (persona) {
    chunks.push(persona);
  }

  if (params.sections && params.sections.length > 0) {
    const sections = params.sections.filter((s) => s && s.title);
    const formattedSections = sections
      .filter((s) => !isFlagSection(s.title))
      .map((s) => {
        const titleLine = joinNonEmpty(
          [
            s.title,
            s.percentage !== null && s.percentage !== undefined
              ? `${s.percentage}%`
              : "",
            s.scale !== null && s.scale !== undefined ? `${s.scale}/10` : "",
          ],
          " "
        );

        const tags = s.tags
          ?.filter(Boolean)
          .map((t) => (t ?? "").trim())
          .filter((t) => t.length > 0);
        const tagsLine = tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : "";

        const context = normalizeContextText((s as any)?.context).trim();

        return joinNonEmpty([titleLine, tagsLine, context], "\n");
      })
      .filter((block) => block.length > 0)
      .map((block) => `• ${block.replace(/\n/g, "\n  ")}`)
      .join("\n\n");

    const sectionBlock = asSection("Insights", formattedSections);
    if (sectionBlock) {
      chunks.push(sectionBlock);
    }
  }

  if (relationshipSignals) {
    chunks.push(relationshipSignals);
  }

  chunks.push(`Generated by ${APP_NAME}`);

  return chunks.filter(Boolean).join("\n").trim();
};

export const buildTextAnalysisShareText = (analysis: AnalyzerResponse) => {
  const subjectLine = (analysis.profile?.name ?? "").trim();

  const meta = joinNonEmpty(
    [
      analysis.profile?.age !== null && analysis.profile?.age !== undefined
        ? String(analysis.profile.age)
        : "",
      analysis.profile?.gender ?? "",
      analysis.profile?.relationship_tag ?? "",
    ],
    " • "
  );

  const chunks: string[] = [
    asHeader("Text Analysis", subjectLine, meta),
  ];

  const summary = asSection("Summary", analysis.summary);
  if (summary) chunks.push(summary);

  const emotions = analysis.detected_emotions
    ?.map((e) => (e ?? "").trim())
    .filter((e) => e.length > 0);
  const emotionsBlock = asSection(
    "Detected Emotions",
    emotions && emotions.length > 0 ? emotions.join(", ") : ""
  );
  if (emotionsBlock) chunks.push(emotionsBlock);

  const toneBlock = joinNonEmpty(
    [
      analysis.overall_tone ? `Overall tone: ${analysis.overall_tone.trim()}` : "",
      analysis.subtext ? `Subtext: ${analysis.subtext.trim()}` : "",
    ],
    "\n"
  );
  const tone = asSection("Tone", toneBlock);
  if (tone) chunks.push(tone);

  const specified = asSection("Specified Analysis", analysis.specified_analysis);
  if (specified) chunks.push(specified);

  if (analysis.suggested_reply) {
    const reply = joinNonEmpty(
      [
        analysis.suggested_reply.guidance
          ? `Guidance: ${analysis.suggested_reply.guidance.trim()}`
          : "",
        analysis.suggested_reply.why_this_helps
          ? `Why this helps: ${analysis.suggested_reply.why_this_helps.trim()}`
          : "",
        analysis.suggested_reply.timing_note
          ? `Timing note: ${analysis.suggested_reply.timing_note.trim()}`
          : "",
      ],
      "\n"
    );

    const suggested = asSection("Suggested Reply", reply);
    if (suggested) chunks.push(suggested);
  }

  const recs = asBulletList(analysis.recommendations ?? null);
  const recommendations = asSection("Recommendations", recs);
  if (recommendations) chunks.push(recommendations);

  const preds = asBulletList(analysis.predictions ?? null);
  const predictions = asSection("Predictions", preds);
  if (predictions) chunks.push(predictions);

  if (analysis.watch_out_for && analysis.watch_out_for.length > 0) {
    const formatted = analysis.watch_out_for
      .map((w) => {
        const msg = (w?.message ?? "").trim();
        const ctx = (w?.context ?? "").trim();
        if (!msg && !ctx) return "";
        return joinNonEmpty([msg, ctx ? `Context: ${ctx}` : ""], "\n");
      })
      .filter((b) => b.length > 0)
      .map((b) => `- ${b.replace(/\n/g, "\n  ")}`)
      .join("\n");

    const watchOut = asSection("What to watch out for", formatted);
    if (watchOut) chunks.push(watchOut);
  }

  chunks.push(`Generated by ${APP_NAME}`);

  return chunks.filter(Boolean).join("\n").trim();
};
