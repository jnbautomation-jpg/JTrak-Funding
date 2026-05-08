"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, Save, X } from "lucide-react"
import { toast } from "sonner"

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
import { formatDate, formatMoney } from "@/lib/utils"
import { updateVehicle } from "../actions"

export type VehicleDetail = {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  mileage: number | null
  purchasePrice: number
  purchaseDate: string
  source: string | null
  stockNumber: string | null
  notes: string | null
}

const formSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .length(17)
    .regex(/^[A-HJ-NPR-Z0-9]+$/),
  year: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(
      z
        .number()
        .int()
        .min(1900)
        .max(new Date().getFullYear() + 1)
    ),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  trim: z.string().trim().max(80).optional(),
  mileage: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) =>
      v === "" || v == null
        ? undefined
        : typeof v === "string"
        ? Number(v)
        : v
    )
    .pipe(z.number().int().nonnegative().optional()),
  purchasePrice: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(z.number().positive()),
  purchaseDate: z.string().min(1),
  source: z.string().trim().max(60).optional(),
  stockNumber: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof formSchema>

export function VehicleInfoCard({
  vehicle,
  initialEdit,
  sources,
}: {
  vehicle: VehicleDetail
  initialEdit: boolean
  sources: string[]
}) {
  const [editing, setEditing] = React.useState(initialEdit)

  if (!editing) {
    return (
      <ReadView vehicle={vehicle} onEdit={() => setEditing(true)} />
    )
  }

  return (
    <EditView
      vehicle={vehicle}
      sources={sources}
      onCancel={() => setEditing(false)}
    />
  )
}

function ReadView({
  vehicle,
  onEdit,
}: {
  vehicle: VehicleDetail
  onEdit: () => void
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/60">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Vehicle information
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-7 text-[12px]"
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 text-[13px]">
        <Field label="VIN">
          <span className="font-mono text-foreground">{vehicle.vin}</span>
        </Field>
        <Field label="Stock #">{vehicle.stockNumber || "—"}</Field>
        <Field label="Year / Make / Model">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ""}
        </Field>
        <Field label="Mileage">
          {vehicle.mileage != null
            ? vehicle.mileage.toLocaleString("en-US")
            : "—"}
        </Field>
        <Field label="Purchase price">
          <span className="tabular-nums">
            {formatMoney(vehicle.purchasePrice)}
          </span>
        </Field>
        <Field label="Purchase date">{formatDate(vehicle.purchaseDate)}</Field>
        <Field label="Source">{vehicle.source || "—"}</Field>
        <Field label="Notes" full>
          {vehicle.notes ? (
            <span className="whitespace-pre-line">{vehicle.notes}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Field>
      </dl>
    </div>
  )
}

function Field({
  label,
  full,
  children,
}: {
  label: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={full ? "sm:col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}>
      <dt className="text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
        {label}
      </dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}

function EditView({
  vehicle,
  sources,
  onCancel,
}: {
  vehicle: VehicleDetail
  sources: string[]
  onCancel: () => void
}) {
  const router = useRouter()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim ?? "",
      mileage: vehicle.mileage ?? "",
      purchasePrice: vehicle.purchasePrice,
      purchaseDate: vehicle.purchaseDate.slice(0, 10),
      source: vehicle.source ?? "",
      stockNumber: vehicle.stockNumber ?? "",
      notes: vehicle.notes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const result = await updateVehicle({
      id: vehicle.id,
      vin: values.vin.toUpperCase(),
      year: Number(values.year),
      make: values.make,
      model: values.model,
      trim: values.trim || "",
      mileage:
        values.mileage === "" || values.mileage == null
          ? null
          : Number(values.mileage),
      purchasePrice: Number(values.purchasePrice),
      purchaseDate: new Date(values.purchaseDate),
      source: values.source || "",
      stockNumber: values.stockNumber || "",
      notes: values.notes || "",
    })

    if (!result.ok) {
      setSubmitError(result.error)
      toast.error("Could not save", { description: result.error })
      return
    }

    toast.success("Vehicle updated")
    router.replace(`/vehicles/${vehicle.id}`)
    router.refresh()
    onCancel()
  }

  const pending = form.formState.isSubmitting

  return (
    <div className="rounded-lg border border-border/70 bg-card/60">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Edit vehicle
        </h2>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-3 px-5 py-5"
          suppressHydrationWarning
        >
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  VIN
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={17}
                    className="h-9 text-[13px] font-mono uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Year
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    className="h-9 text-[13px]"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Mileage
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    className="h-9 text-[13px]"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Make
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-9 text-[13px]" />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Model
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-9 text-[13px]" />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="trim"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Trim
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-9 text-[13px]" />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Purchase price
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    step="0.01"
                    className="h-9 text-[13px]"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Purchase date
                </FormLabel>
                <FormControl>
                  <Input {...field} type="date" className="h-9 text-[13px]" />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Source
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    list="vehicle-sources-edit"
                    className="h-9 text-[13px]"
                  />
                </FormControl>
                <datalist id="vehicle-sources-edit">
                  {sources.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Stock #
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-9 text-[13px]" />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Notes
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          {submitError ? (
            <p className="col-span-2 text-[11.5px] text-destructive">
              {submitError}
            </p>
          ) : null}
          <div className="col-span-2 flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={pending}
              className="h-9 text-[13px]"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-9 text-[13px]"
            >
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
