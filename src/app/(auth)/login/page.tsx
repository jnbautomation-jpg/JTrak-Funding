"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRight, Lock } from "lucide-react"

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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginValues) {
    // Phase 1: stub. Wire to Supabase auth in Phase 2.
    // eslint-disable-next-line no-console
    console.log("[stub login]", values)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background layers */}
      <div className="absolute inset-0 bg-emerald-radial" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        aria-hidden
      />

      {/* Content */}
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Wordmark */}
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

          {/* Card */}
          <div className="relative rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_4%,transparent)_inset,0_24px_64px_-32px_rgb(0_0_0/0.6)]">
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Use your work email to access the dashboard.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[12px] font-medium text-muted-foreground">
                          Password
                        </FormLabel>
                        <button
                          type="button"
                          onClick={() => console.log("[stub] forgot password")}
                          className="text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="h-10 text-[13px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11.5px]" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-1 h-10 text-[13px] font-medium group"
                >
                  Sign in
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </form>
            </Form>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Lock className="size-3" />
              <span>Encrypted in transit · Single tenant</span>
            </div>
          </div>

          <p className="mt-5 text-center text-[11.5px] text-muted-foreground/80">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
