import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-display font-bold text-lg">
              <span className="gradient-text">Revenue Optimization</span>{" "}
              <span className="text-foreground">with StatsDrone</span>
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Optimizing revenue, one episode at a time.
            </p>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Home
            </Link>
            <Link
              to="/episodes/"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Episodes
            </Link>
          </nav>

          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} StatsDrone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
