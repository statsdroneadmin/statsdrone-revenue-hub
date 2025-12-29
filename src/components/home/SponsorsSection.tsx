import { ExternalLink } from "lucide-react";

// Placeholder sponsors - replace with real data
const majorSponsors = [
  { name: "Major Sponsor 1", logo: null, url: "#" },
  { name: "Major Sponsor 2", logo: null, url: "#" },
  { name: "Major Sponsor 3", logo: null, url: "#" },
  { name: "Major Sponsor 4", logo: null, url: "#" },
];

const subSponsors = [
  { name: "Sub Sponsor 1", favicon: null, url: "#" },
  { name: "Sub Sponsor 2", favicon: null, url: "#" },
  { name: "Sub Sponsor 3", favicon: null, url: "#" },
  { name: "Sub Sponsor 4", favicon: null, url: "#" },
  { name: "Sub Sponsor 5", favicon: null, url: "#" },
  { name: "Sub Sponsor 6", favicon: null, url: "#" },
  { name: "Sub Sponsor 7", favicon: null, url: "#" },
  { name: "Sub Sponsor 8", favicon: null, url: "#" },
];

const SponsorsSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Our <span className="gradient-text">Sponsors</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Thank you to our amazing sponsors who make this podcast possible.
          </p>
        </div>

        {/* Major Sponsors */}
        <div className="mb-16">
          <h3 className="text-center text-sm font-semibold text-accent uppercase tracking-wider mb-8">
            Presented By
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {majorSponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-card rounded-2xl p-8 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-card flex items-center justify-center min-h-[140px]"
              >
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="max-h-16 max-w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-secondary rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {sponsor.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {sponsor.name}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Sub Sponsors */}
        <div>
          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Also Supported By
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {subSponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg border border-border hover:border-accent/50 hover:bg-secondary transition-all duration-300"
              >
                {sponsor.favicon ? (
                  <img
                    src={sponsor.favicon}
                    alt=""
                    className="w-5 h-5 rounded"
                  />
                ) : (
                  <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      {sponsor.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {sponsor.name}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;
