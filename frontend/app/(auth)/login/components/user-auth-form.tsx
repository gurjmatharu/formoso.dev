"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [isSignUp, setIsSignUp] = React.useState<boolean>(true); // Toggle between sign-up and login

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      let error;
      if (isSignUp) {
        // Sign up with email and password
        ({ error } = await supabase.auth.signUp({
          email,
          password,
        }));

        if (!error) {
          alert("Account created successfully! Please check your email to confirm.");
        }
      } else {
        // Log in with email and password
        ({ error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));

        if (!error) {
          router.push("/dashboard"); // Redirect after successful login
        }
      }

      if (error) {
        console.error("Auth error:", error.message);
        alert(isSignUp ? "Account creation failed. Please try again." : "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGitHub() {
    setIsLoading(true);

    try {
      // Sign in with GitHub provider
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
      });

      if (error) {
        console.error("GitHub sign-in error:", error.message);
        alert("GitHub sign-in failed.");
      } else {
        router.push("/dashboard"); // Redirect after successful GitHub login
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Create Account" : "Log In"}
          </Button>
        </div>
      </form>
      <div className="text-center text-sm mt-4">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:underline"
          disabled={isLoading}
        >
          {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </button>
      </div>
      <div className="relative mt-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or {isSignUp ? "sign up" : "log in"} with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} onClick={signInWithGitHub}>
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LoaderCircle className="mr-2 h-4 w-4" />
        )}
        GitHub
      </Button>
    </div>
  );
}
