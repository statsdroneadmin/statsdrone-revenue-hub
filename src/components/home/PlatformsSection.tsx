import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PlatformsSection = () => {
  return (
    <section id="platforms" className="py-20 md:py-32 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">
            A Leading Affiliate Marketing Podcast
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            The Revenue Optimization with StatsDrone podcast was launched in August 2023. It used to be called the Affiliate BI podcast but was rebranded in late 2025.
          </p>
          <p className="text-muted-foreground text-lg mb-12">
            Some notable guests of the podcast include people like Matt Diggity, Koray Tuğberk GÜBÜR, Lily Ray, Kyle Roof, Oliver Kenyon, Chris Walker, Lashay Lewis, Clemence Dujardin, and many more!
          </p>

          <div className="text-left">
            <h3 className="font-display text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border/50">
                <AccordionTrigger className="text-left hover:no-underline">
                  What topics do you cover in the Revenue Optimization with StatsDrone podcast?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We cover affiliate marketing, SEO, business intelligence and AI on this podcast. The topics within can range from content strategies to CMO to conversion rate optimization.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-border/50">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is the best way to get started in affiliate marketing?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Affiliate marketing is changing at a pace we haven't seen in a long time. The rules of affiliate marketing are being rewritten as well as the rules for ranking content in search engines. The world of SEO is experiencing a massive change and this is our new normal.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-border/50">
                <AccordionTrigger className="text-left hover:no-underline">
                  How can I be a guest on the podcast?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Contact <a href="https://www.linkedin.com/in/alwayslookright/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">John Wright</a> via LinkedIn. Just keep in mind that we usually seek out guests and rarely accept requests.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-border/50">
                <AccordionTrigger className="text-left hover:no-underline">
                  How can I become a sponsor or advertise?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Contact <a href="https://www.linkedin.com/in/alwayslookright/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">John Wright</a> for rates and how you can also become a marketing partner with our podcast.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformsSection;
