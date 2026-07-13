import Footer from "@/components/layout/Footer";

/**
 * (marketing) route group layout — wraps all public-facing pages
 * (Home, Inventory, Gallery, Contact, Team) with the shared Footer.
 * Header is rendered per-page (not here) since each legacy page had a
 * slightly different <h1>/<p> tagline — see Header.tsx props.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-[#FDFBF7]">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
