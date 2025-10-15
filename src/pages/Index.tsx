import Hero from "@/components/Hero";

const Index = () => {
  return (
    <>
      <Hero />
      <div className="w-full max-w-7xl mx-auto px-6 py-20">
        <iframe 
          src="https://claude.site/public/artifacts/37063a1b-99fd-4aba-9fdf-93b14e85835d/embed" 
          title="Claude Artifact" 
          width="100%" 
          height="600" 
          frameBorder="0" 
          allow="clipboard-write" 
          allowFullScreen
        />
      </div>
    </>
  );
};

export default Index;
