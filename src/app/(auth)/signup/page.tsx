"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: SignupValues) {
    setSubmitError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setSubmitError(error.message)
      toast.error("Sign up failed", { description: error.message })
      return
    }

    if (!data.session) {
      // Email confirmation required — let the user know.
      toast.info("Check your email to confirm your account.", {
        description: "Then sign in to finish setup.",
      })
      router.replace("/login")
      return
    }

    toast.success("Account created")
    router.replace("/onboarding")
    router.refresh()
  }

  const pending = form.formState.isSubmitting

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-emerald-radial" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        aria-hidden
      />

      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-9 flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30 text-primary"
            >
              <span className="text-base font-semibold tracking-tight">J</span>
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-[20px] font-semibold tracking-tight leading-none">
                JTrak <span className="text-primary">Funding</span>
              </h1>
              <p className="text-[12px] text-muted-foreground">
                Floorplan management for dealers and investors.
              </p>
            </div>
          </div>

          <div className="relative rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_4%,transparent)_inset,0_24px_64px_-32px_rgb(0_0_0/0.6)]">
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Create your account
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Stand up your floorplan in under a minute.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                suppressHydrationWarning
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] font-medium text-muted-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@dealership.com"
                          className="h-10 text-[13px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] font-medium text-muted-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          className="h-10 text-[13px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] font-medium text-muted-foreground">
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="h-10 text-[13px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />

                {submitError ? (
                  <p className="text-[11.5px] text-destructive">
                    {submitError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={pending}
                  className="mt-1 h-10 text-[13px] font-medium group"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Lock className="size-3" />
              <span>Encrypted in transit · Single tenant</span>
            </div>
          </div>

          <p className="mt-5 text-center text-[11.5px] text-muted-foreground/80">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground/90 hover:text-primary transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
