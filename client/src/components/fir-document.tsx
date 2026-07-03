import { cn } from "@/lib/utils";

type FirDocumentProps = {
  text?: string | null;
  title?: string;
  className?: string;
};

type FirBlock =
  | { type: "heading"; label: string; value?: string }
  | { type: "listItem"; value: string }
  | { type: "paragraph"; value: string };

function parseFirBlocks(text: string): FirBlock[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const headingMatch = line.match(/^([^:]{1,48}):\s*(.*)$/);
    if (headingMatch) {
      const label = headingMatch[1].trim();
      const value = headingMatch[2].trim();

      if (label.length <= 48) {
        return { type: "heading", label, value };
      }
    }

    if (/^(\d+\.|[-*])\s+/.test(line)) {
      return { type: "listItem", value: line.replace(/^(\d+\.|[-*])\s+/, "") };
    }

    return { type: "paragraph", value: line };
  });
}

export function FirDocument({
  text,
  title = "Official FIR Draft",
  className,
}: FirDocumentProps) {
  if (!text) {
    return null;
  }

  const blocks = parseFirBlocks(text);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-background/80 shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          CyberDesk
        </p>
        <h4 className="mt-1 text-lg font-bold text-foreground">{title}</h4>
      </div>

      <div className="px-5 py-5 space-y-4 text-sm leading-7 text-foreground/90">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <div key={`${block.label}-${index}`} className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  {block.label}
                </p>
                {block.value ? (
                  <p className="whitespace-pre-wrap text-foreground/85">
                    {block.value}
                  </p>
                ) : null}
              </div>
            );
          }

          if (block.type === "listItem") {
            return (
              <div key={`${block.value}-${index}`} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary/70" />
                <p className="flex-1 whitespace-pre-wrap">{block.value}</p>
              </div>
            );
          }

          return (
            <p key={`${block.value}-${index}`} className="whitespace-pre-wrap">
              {block.value}
            </p>
          );
        })}
      </div>
    </div>
  );
}
