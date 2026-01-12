import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TranscriptSectionProps {
  slug: string;
}

const TranscriptSection = ({ slug }: TranscriptSectionProps) => {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const response = await fetch(`/ep/${slug}/transcript.md`);
        if (response.ok) {
          const text = await response.text();
          setTranscript(text);
        } else {
          setTranscript(null);
        }
      } catch {
        setTranscript(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [slug]);

  if (loading || !transcript) {
    return null;
  }

  // Split transcript into paragraphs
  const paragraphs = transcript.split(/\n\n+/).filter(p => p.trim());
  const previewParagraphs = paragraphs.slice(0, 3);
  const hasMore = paragraphs.length > 3;

  // Simple markdown-to-HTML conversion for basic formatting
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="font-display text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-display text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="font-display text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="bg-gradient-card rounded-2xl p-8 border border-border mb-16">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-accent" />
        <h2 className="font-display text-xl font-bold">Episode Transcript</h2>
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="prose prose-invert max-w-none">
          {/* Always show preview paragraphs */}
          {previewParagraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-muted-foreground leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(paragraph) }}
            />
          ))}

          {/* Expandable content */}
          {hasMore && (
            <CollapsibleContent>
              {paragraphs.slice(3).map((paragraph, index) => (
                <p
                  key={index + 3}
                  className="text-muted-foreground leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(paragraph) }}
                />
              ))}
            </CollapsibleContent>
          )}
        </div>

        {hasMore && (
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mt-4 w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Read Full Transcript
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
    </div>
  );
};

export default TranscriptSection;
