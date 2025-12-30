import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const affiliateTools = [
  {
    name: "Lovable",
    description: "Build web apps with AI",
    url: "https://lovable.dev/?via=statsdrone",
  },
  {
    name: "Coming Soon",
    description: "More tools coming",
    url: "#",
  },
  {
    name: "Coming Soon",
    description: "More tools coming",
    url: "#",
  },
  {
    name: "Coming Soon",
    description: "More tools coming",
    url: "#",
  },
];

const AffiliateTools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
            Affiliate Tools
          </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {affiliateTools.map((tool, index) => (
              <a
                key={index}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={tool.url === "#" ? "pointer-events-none" : ""}
              >
                <Card className="h-full bg-secondary/30 border-border hover:border-accent/50 hover:bg-secondary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/10">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">
                      {tool.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {tool.description}
                    </p>
                    {tool.url !== "#" && (
                      <ExternalLink className="w-4 h-4 text-accent mt-2" />
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateTools;
