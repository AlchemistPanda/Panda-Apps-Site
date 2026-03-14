export default function MathTugOfWarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide global nav/footer for this fullscreen game */}
      <style dangerouslySetInnerHTML={{ __html: `
        nav, footer, .gradient-bg, .grid-pattern { display: none !important; }
        main { z-index: auto !important; }
      `}} />
      {children}
    </>
  );
}
