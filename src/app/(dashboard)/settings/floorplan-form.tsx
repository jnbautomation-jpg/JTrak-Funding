"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateFloorplanSettings } from "./actions"

type Props = {
  initial: {
    investorName: string
    investorEmail: string
    investorPhone: string
    investorNotes: string
    floorplanName: string
    creditLimit: number
  }
}

export function FloorplanForm({ initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [values, setValues] = React.useState({
    investorName: initial.investorName,
    investorEmail: initial.investorEmail,
    investorPhone: initial.investorPhone,
    investorNotes: initial.investorNotes,
    floorplanName: initial.floorplanName,
    creditLimit: String(initial.creditLimit),
  })
  const [error, setError] = React.useState<string | null>(null)

  function update<K extends keyof typeof values>(
    key: K,
    val: (typeof values)[K]
  ) {
    setValues((s) => ({ ...s, [key]: val }))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const limit = Number(values.creditLimit)
    if (!Number.isFinite(limit) || limit <= 0) {
      setError("Credit limit must be greater than zero")
      return
    }
    startTransition(async () => {
      const result = await updateFloorplanSettings({
        investorName: values.investorName,
        investorEmail: values.investorEmail,
        investorPhone: values.investorPhone,
        investorNotes: values.investorNotes,
        floorplanName: values.floorplanName,
        creditLimit: limit,
      })
      if (!result.ok) {
        setError(result.error)
        toast.error("Could not save", { description: result.error })
        return
      }
      if (result.warning) {
        toast.warning("Saved with warning", { description: result.warning })
      } else {
        toast.success("Floorplan updated")
      }
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border/70 bg-card/60 p-4 sm:p-5"
      suppressHydrationWarning
    >
      <Field label="Investor name" required>
        <Input
          value={values.investorName}
          onChange={(e) => update("investorName", e.target.value)}
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Investor email">
        <Input
          type="email"
          value={values.investorEmail}
          onChange={(e) => update("investorEmail", e.target.value)}
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Investor phone">
        <Input
          value={values.investorPhone}
          onChange={(e) => update("investorPhone", e.target.value)}
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Floorplan name" required>
        <Input
          value={values.floorplanName}
          onChange={(e) => update("floorplanName", e.target.value)}
          className="h-9 text-[13px]"
        />
      </Field>
      <Field label="Credit limit (USD)" required>
        <Input
          type="number"
          inputMode="numeric"
          value={values.creditLimit}
          onChange={(e) => update("creditLimit", e.target.value)}
          className="h-9 text-[13px] tabular-nums"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Investor notes">
          <textarea
            value={values.investorNotes}
            onChange={(e) => update("investorNotes", e.target.value)}
            rows={3}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </Field>
      </div>

      {error ? (
        <p className="sm:col-span-2 text-[11.5px] text-destructive">{error}</p>
      ) : null}

      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={pending} className="h-9 text-[13px]">
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12px] font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
    </div>
  )
}
