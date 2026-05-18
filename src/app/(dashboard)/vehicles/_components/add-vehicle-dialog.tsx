"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { decodeVin } from "@/lib/vin"
import { formatMoney } from "@/lib/utils"
import { createVehicle } from "../actions"

const COMMON_SOURCES = [
  "Manheim",
  "Adesa",
  "Copart",
  "Private Party",
  "Trade-In",
  "Other",
]

const todayISO = () => new Date().toISOString().slice(0, 10)

const formSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .length(17, "VIN must be 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "VIN contains invalid characters"),
  year: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .pipe(
      z
        .number()
        .int("Year must be a whole number")
        .min(1900, "Year too old")
        .max(new Date().getFullYear() + 1)
    ),
  make: z.string().trim().min(1, "Required").max(60),
  model: z.string().trim().min(1, "Required").max(80),
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
    .pipe(z.number().positive("Must be greater than zero")),
  purchaseDate: z.string().min(1, "Required"),
  source: z.string().trim().max(60).optional(),
  stockNumber: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof formSchema>

export function AddVehicleButton({
  sources,
  availableCredit,
}: {
  sources: string[]
  availableCredit?: number
}) {
  const [open, setOpen] = React.useState(false)
  const sourceOptions = React.useMemo(() => {
    const merged = new Set<string>([...COMMON_SOURCES, ...sources])
    return Array.from(merged)
  }, [sources])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-8 text-[12.5px] gap-1.5" />}>
        <Plus className="size-3.5" />
        Add Vehicle
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
          <DialogDescription>
            Enter the VIN to auto-fill year/make/model, then complete the
            advance details.
          </DialogDescription>
        </DialogHeader>
        <AddVehicleForm
          onSuccess={() => setOpen(false)}
          sourceOptions={sourceOptions}
          availableCredit={availableCredit}
        />
      </DialogContent>
    </Dialog>
  )
}

function AddVehicleForm({
  onSuccess,
  sourceOptions,
  availableCredit,
}: {
  onSuccess: () => void
  sourceOptions: string[]
  availableCredit?: number
}) {
  const router = useRouter()
  const [decoded, setDecoded] = React.useState(false)
  const [decoding, setDecoding] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vin: "",
      year: undefined as unknown as number,
      make: "",
      model: "",
      trim: "",
      mileage: "",
      purchasePrice: undefined as unknown as number,
      purchaseDate: todayISO(),
      source: "",
      stockNumber: "",
      notes: "",
    },
  })

  const vin = form.watch("vin")
  const purchasePrice = form.watch("purchasePrice")

  React.useEffect(() => {
    setDecoded(false)
    if (!vin || vin.length !== 17) return
    let cancelled = false
    setDecoding(true)
    decodeVin(vin)
      .then((result) => {
        if (cancelled) return
        if (!result) return
        if (result.year && !form.getValues("year")) {
          form.setValue("year", result.year, { shouldValidate: true })
        }
        if (result.make && !form.getValues("make")) {
          form.setValue("make", result.make, { shouldValidate: true })
        }
        if (result.model && !form.getValues("model")) {
          form.setValue("model", result.model, { shouldValidate: true })
        }
        if (result.trim && !form.getValues("trim")) {
          form.setValue("trim", result.trim, { shouldValidate: true })
        }
        if (result.year || result.make || result.model) setDecoded(true)
      })
      .finally(() => {
        if (!cancelled) setDecoding(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin])

  const overLimit =
    typeof availableCredit === "number" &&
    typeof purchasePrice === "number" &&
    Number.isFinite(purchasePrice) &&
    purchasePrice > availableCredit

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const result = await createVehicle({
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
      toast.error("Could not add vehicle", { description: result.error })
      return
    }

    toast.success("Vehicle added", {
      description: `${formatMoney(Number(values.purchasePrice))} advanced from floorplan.`,
    })
    form.reset()
    onSuccess()
    router.refresh()
  }

  const pending = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        suppressHydrationWarning
      >
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  VIN
                </FormLabel>
                {decoding ? (
                  <span className="text-[10.5px] text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Decoding…
                  </span>
                ) : decoded ? (
                  <span className="text-[10.5px] text-primary inline-flex items-center gap-1">
                    <Check className="size-3" />
                    Decoded
                  </span>
                ) : null}
              </div>
              <FormControl>
                <Input
                  {...field}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="h-9 text-[13px] font-mono uppercase tracking-wide"
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase())
                  }
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
                  inputMode="numeric"
                  className="h-9 text-[13px] tabular-nums"
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
                  inputMode="numeric"
                  placeholder="optional"
                  className="h-9 text-[13px] tabular-nums"
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
            <FormItem className="sm:col-span-2">
              <FormLabel className="text-[12px] font-medium text-muted-foreground">
                Trim
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="optional"
                  className="h-9 text-[13px]"
                />
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
                Purchase price (USD)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="h-9 text-[13px] tabular-nums"
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
                  list="vehicle-sources"
                  placeholder="optional"
                  className="h-9 text-[13px]"
                />
              </FormControl>
              <datalist id="vehicle-sources">
                {sourceOptions.map((s) => (
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
                <Input
                  {...field}
                  placeholder="optional"
                  className="h-9 text-[13px]"
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel className="text-[12px] font-medium text-muted-foreground">
                Notes
              </FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  placeholder="optional"
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        {overLimit ? (
          <div className="sm:col-span-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11.5px] text-amber-700 dark:text-amber-300">
            ⚠️ This advance ({formatMoney(Number(purchasePrice))}) exceeds
            available credit ({formatMoney(availableCredit ?? 0)}). You&rsquo;ll
            be over your limit.
          </div>
        ) : null}

        {submitError ? (
          <p className="sm:col-span-2 text-[11.5px] text-destructive">
            {submitError}
          </p>
        ) : null}

        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <Button type="submit" disabled={pending} className="h-9 text-[13px]">
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Adding…
              </>
            ) : (
              "Add vehicle"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
