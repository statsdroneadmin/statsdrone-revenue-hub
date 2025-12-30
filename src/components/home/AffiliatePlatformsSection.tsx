import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import myaffiliatesLogo from "@/assets/myaffiliates.png";
import raventrackLogo from "@/assets/raventrack.png";
import affilkaLogo from "@/assets/affilka.png";
import referonLogo from "@/assets/referon.png";

const platforms = [
  {
    name: "MyAffiliates",
    url: "https://myaffiliates.com",
    logo: myaffiliatesLogo,
  },
  {
    name: "RavenTrack",
    url: "https://www.raventrack.com/",
    logo: raventrackLogo,
  },
  {
    name: "Affilka",
    url: "https://affilka.com/",
    logo: affilkaLogo,
  },
  {
    name: "ReferOn",
    url: "https://referon.com/",
    logo: referonLogo,
  },
];

const AffiliatePlatformsSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
          Recommended Affiliate Platforms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform, index) => (
            <a
              key={index}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full bg-secondary/30 border-border hover:border-accent/50 hover:bg-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-lg bg-background/80 flex items-center justify-center overflow-hidden">
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {platform.name}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AffiliatePlatformsSection;
