// app/page.tsx

import Image from "next/image";
import Link from "next/link";
import {
  Button,
  buttonVariants,
} from "@/components/ui/button";
import {
  Badge,
} from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Formoso.dev Logo"
              width={150}
              height={50}
            />
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/features" legacyBehavior passHref>
                  <NavigationMenuLink className="p-2">
                    Features
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className="p-2">
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/contact" legacyBehavior passHref>
                  <NavigationMenuLink className="p-2">
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">
              Elevate Customer Experiences with{" "}
              <span className="text-blue-600">Formoso.dev</span>
            </h1>
            <p className="text-lg mb-8">
              Seamless Form Management and Real-Time Support
            </p>
            <Button asChild size="lg">
              <Link href="/get-started">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-semibold text-center mb-12">
              Why Choose Formoso.dev?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card>
                <CardHeader>
                  <CardTitle>Unified Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Manage form submissions and engage with customers in real-time through a single, cohesive interface.
                  </p>
                </CardContent>
              </Card>
              {/* Feature 2 */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Spam Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Utilize cutting-edge AI to automatically detect and eliminate spam and malicious submissions in real-time.
                  </p>
                </CardContent>
              </Card>
              {/* Feature 3 */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-Time Support Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Engage with customers instantly through a robust chat system integrated directly into the platform.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-blue-600 py-16 text-white text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Transform Your Customer Experience?
            </h2>
            <p className="mb-8">
              Get started with Formoso.dev today and see the difference.
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/sign-up">Sign Up Now</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 text-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Formoso.dev. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
