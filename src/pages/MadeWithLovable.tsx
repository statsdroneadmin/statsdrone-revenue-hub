import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/seo/Seo";
import heroImage from "@/assets/podcast-website-built-with-lovable.jpg";

const LovableLink = ({ children }: { children: React.ReactNode }) => (
  <a
    href="https://lovable.dev/?via=statsdrone"
    target="_blank"
    rel="noopener noreferrer"
    className="text-accent hover:text-accent/80 hover:underline transition-colors"
  >
    {children}
  </a>
);

const MadeWithLovable = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Built with Lovable | Revenue Optimization"
        description="How this Revenue Optimization podcast website was built using Lovable, plus the workflow for updates and SEO."
        canonicalPath="/made-with-lovable"
        image={heroImage}
        ogType="article"
      />
      <Header />
      <main className="container mx-auto px-4 pt-24 md:pt-32 pb-16">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
            Built with <LovableLink>Lovable</LovableLink>
          </h1>

          <section className="prose prose-invert max-w-none">
            <p className="text-xl text-muted-foreground mb-6 font-medium">
              How I built my podcast website using Lovable
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              So I made this website using <LovableLink>Lovable</LovableLink> and not only that, all updates I'm making to this podcast website are updated with a simple prompt.
            </p>

            <img
              src={heroImage}
              alt="Podcast website built with Lovable"
              className="w-full rounded-xl border border-border mb-8"
            />

            <p className="text-lg text-muted-foreground mb-8">
              I started with <LovableLink>Lovable</LovableLink> in one browser and Claude.ai in another and asked for them to design my podcast website. Lovable I find usually creates better designs so I went with Lovable although I was intending to build and update using Lovable.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">
              Workflow for Building the Podcast Website
            </h2>

            <ol className="list-decimal list-inside space-y-3 text-lg text-muted-foreground mb-8">
              <li>Lovable for the design</li>
              <li>Cloned the site for CSS &amp; HTML</li>
              <li>Connected with Github</li>
              <li>Configured with Cloudflare</li>
              <li>RSS feed auto updating the pages</li>
            </ol>

            <p className="text-lg text-muted-foreground mb-6">
              I've built out what I want as the perfect podcast website without having to build, design or pay for WordPress templates and themes.
            </p>

            <p className="text-lg text-muted-foreground mb-6">
              If I like a cool feature from another podcast site, I can likely build the same thing as a single prompt.
            </p>

            <p className="text-lg text-muted-foreground">
              <LovableLink>Lovable</LovableLink> is great for building websites but I think it is perfect for podcast websites whether they are B2B podcasts or anything else.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default MadeWithLovable;
