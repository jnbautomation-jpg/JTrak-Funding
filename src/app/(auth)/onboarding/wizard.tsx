"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { completeOnboarding } from "./actions"

type Values = {
  investorName: string
  investorEmail: string
  investorPhone: string
  investorNotes: string
  floorplanName: string
  creditLimit: string
}

const DEFAULT_LIMIT = "400000"

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [pending, startTransition] = React.useTransition()
  const [errors, setErrors] = React.useState<Partial<Record<keyof Values, string>>>(
    {}
  )
  const [values, setValues] = React.useState<Values>({
    investorName: "",
    investorEmail: "",
    investorPhone: "",
    investorNotes: "",
    floorplanName: "Primary Line",
    creditLimit: DEFAULT_LIMIT,
  })

  function update<K extends keyof Values>(key: K, val: Values[K]) {
    setValues((s) => ({ ...s, [key]: val }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep1() {
    const next: Partial<Record<keyof Values, string>> = {}
    if (!values.investorName.trim()) next.investorName = "Required"
    if (
      values.investorEmail &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.investorEmail)
    )
      next.investorEmail = "Invalid email"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function validateStep2() {
    const next: Partial<Record<keyof Values, string>> = {}
    if (!values.floorplanName.trim()) next.floorplanName = "Required"
    const limit = Number(values.creditLimit)
    if (!Number.isFinite(limit) || limit <= 0)
      next.creditLimit = "Must be greater than zero"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onNext() {
    if (validateStep1()) setStep(2)
  }

  async function onSubmit() {
    if (!validateStep2()) return

    startTransition(async () => {
      const fd = new FormData()
      fd.set("investorName", values.investorName)
      fd.set("investorEmail", values.investorEmail)
      fd.set("investorPhone", values.investorPhone)
      fd.set("investorNotes", values.investorNotes)
      fd.set("floorplanName", values.floorplanName)
      fd.set("creditLimit", String(Number(values.creditLimit)))

      const result = await completeOnboarding(null, fd)
      if (result?.error) {
        toast.error("Setup failed", { description: result.error })
        return
      }
      toast.success("Floorplan ready")
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <div className="relative rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_4%,transparent)_inset,0_24px_64px_-32px_rgb(0_0_0/0.6)]">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        <StepDot index={1} active={step === 1} done={step > 1} />
        <span className="h-px flex-1 bg-border/70" aria-hidden />
        <StepDot index={2} active={step === 2} done={false} />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Investor details
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Who&rsquo;s providing the credit line? You can leave optional
              fields blank.
            </p>
          </div>

          <Field
            id="investorName"
            label="Investor name"
            required
            error={errors.investorName}
          >
            <Input
              id="investorName"
              value={values.investorName}
              onChange={(e) => update("investorName", e.target.value)}
              placeholder="e.g. Smith Capital LLC"
              className="h-10 text-[13px]"
            />
          </Field>

          <Field id="investorEmail" label="Email" error={errors.investorEmail}>
            <Input
              id="investorEmail"
              type="email"
              value={values.investorEmail}
              onChange={(e) => update("investorEmail", e.target.value)}
              placeholder="optional"
              className="h-10 text-[13px]"
            />
          </Field>

          <Field id="investorPhone" label="Phone">
            <Input
              id="investorPhone"
              value={values.investorPhone}
              onChange={(e) => update("investorPhone", e.target.value)}
              placeholder="optional"
              className="h-10 text-[13px]"
            />
          </Field>

          <Field id="investorNotes" label="Notes">
            <textarea
              id="investorNotes"
              value={values.investorNotes}
              onChange={(e) => update("investorNotes", e.target.value)}
              placeholder="optional"
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </Field>

          <div className="flex justify-end pt-1">
            <Button onClick={onNext} className="h-10 text-[13px] group">
              Continue
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Floorplan terms
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Name your line and set the credit limit you have available.
            </p>
          </div>

          <Field
            id="floorplanName"
            label="Floorplan name"
            required
            error={errors.floorplanName}
          >
            <Input
              id="floorplanName"
              value={values.floorplanName}
              onChange={(e) => update("floorplanName", e.target.value)}
              placeholder="Primary Line"
              className="h-10 text-[13px]"
            />
          </Field>

          <Field
            id="creditLimit"
            label="Credit limit (USD)"
            required
            error={errors.creditLimit}
          >
            <Input
              id="creditLimit"
              type="number"
              inputMode="numeric"
              value={values.creditLimit}
              onChange={(e) => update("creditLimit", e.target.value)}
              placeholder="400000"
              className="h-10 text-[13px] tabular-nums"
            />
          </Field>

          <div className="flex justify-between pt-1">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={pending}
              className="h-10 text-[13px]"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            <Button
              onClick={onSubmit}
              disabled={pending}
              className="h-10 text-[13px] group"
            >
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Complete setup
                  <Check className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDot({
  index,
  active,
  done,
}: {
  index: number
  active: boolean
  done: boolean
}) {
  return (
    <span
      className={cn(
        "grid size-7 place-items-center rounded-full text-[11.5px] font-semibold tabular-nums transition-colors",
        done
          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
          : active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground ring-1 ring-border/70"
      )}
    >
      {done ? <Check className="size-3.5" /> : index}
    </span>
  )
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor={id}
        className="text-[12px] font-medium text-muted-foreground"
      >
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
