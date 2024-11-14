import "@/app/globals.css";
import { MainNav } from "@/components/nav-marketing";
import { marketingConfig } from "@/config/marketing";
import { SiteFooter } from "@/components/site-footer";


interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container p-2 pl-2 z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <MainNav items={marketingConfig.mainNav} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
