"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { differenceInCalendarDays } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { cn, formatDate, formatMoney, formatProfit } from "@/lib/utils"
import { markVehicleAsSold } from "../actions"

export type MarkAsSoldVehicle = {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  purchasePrice: number
  advanceAmount: number
  purchaseDate: string
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function MarkAsSoldDialog({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: MarkAsSoldVehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Sold</DialogTitle>
          {vehicle ? (
            <DialogDescription>
              This will record the sale and free up{" "}
              <span className="text-foreground tabular-nums font-medium">
                {formatMoney(vehicle.advanceAmount)}
              </span>{" "}
              in your floorplan.
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {vehicle ? (
          <MarkAsSoldForm
            vehicle={vehicle}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

const formSchema = z
  .object({
    salePrice: z
      .union([z.string(), z.number()])
      .transform((v) => (typeof v === "string" ? Number(v) : v))
      .pipe(z.number().positive("Must be greater than zero")),
    saleDate: z.string().min(1, "Required"),
    buyerName: z.string().trim().max(120).optional(),
  })

type FormValues = z.input<typeof formSchema>

function MarkAsSoldForm({
  vehicle,
  onSuccess,
}: {
  vehicle: MarkAsSoldVehicle
  onSuccess: () => void
}) {
  const router = useRouter()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salePrice: undefined as unknown as number,
      saleDate: todayISO(),
      buyerName: "",
    },
  })

  const watchedSalePrice = form.watch("salePrice")
  const watchedSaleDate = form.watch("saleDate")

  const numericSalePrice =
    watchedSalePrice === undefined || watchedSalePrice === ""
      ? null
      : Number(watchedSalePrice)
  const profitInfo =
    numericSalePrice != null && Number.isFinite(numericSalePrice)
      ? formatProfit(numericSalePrice, vehicle.purchasePrice)
      : null

  const purchaseDateOnly = vehicle.purchaseDate.slice(0, 10)
  const saleBeforePurchase =
    !!watchedSaleDate && watchedSaleDate < purchaseDateOnly

  const today = new Date()
  const daysOnLot = Math.max(
    0,
    differenceInCalendarDays(today, new Date(vehicle.purchaseDate))
  )

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    if (values.saleDate < purchaseDateOnly) {
      const msg = "Sale date can't be before purchase date"
      setSubmitError(msg)
      form.setError("saleDate", { message: msg })
      return
    }

    const result = await markVehicleAsSold({
      vehicleId: vehicle.id,
      salePrice: Number(values.salePrice),
      saleDate: new Date(values.saleDate),
      buyerName: values.buyerName || "",
    })

    if (!result.ok) {
      setSubmitError(result.error)
      toast.error("Could not mark as sold", { description: result.error })
      return
    }

    toast.success(
      `Sold! ${formatMoney(result.advanceAmount)} freed up.`,
      {
        description: `${result.profit >= 0 ? "Profit" : "Loss"}: ${formatMoney(
          Math.abs(result.profit)
        )}`,
      }
    )
    form.reset()
    onSuccess()
    router.refresh()
  }

  const pending = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        suppressHydrationWarning
      >
        <div className="rounded-lg border border-border/70 bg-muted/40 p-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-semibold tracking-tight text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.trim ? (
                <span className="text-muted-foreground"> {vehicle.trim}</span>
              ) : null}
            </p>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              …{vehicle.vin.slice(-6)}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-[11.5px]">
            <div className="flex flex-col gap-0.5">
              <dt className="uppercase tracking-[0.12em] text-muted-foreground/70 text-[10px]">
                Purchased
              </dt>
              <dd className="text-foreground tabular-nums">
                {formatMoney(vehicle.purchasePrice)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="uppercase tracking-[0.12em] text-muted-foreground/70 text-[10px]">
                On
              </dt>
              <dd className="text-foreground tabular-nums">
                {formatDate(vehicle.purchaseDate)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="uppercase tracking-[0.12em] text-muted-foreground/70 text-[10px]">
                Days on lot
              </dt>
              <dd className="text-foreground tabular-nums">{daysOnLot}d</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Sale price (USD)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    autoFocus
                    placeholder="0.00"
                    className="h-9 text-[13px] tabular-nums"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="saleDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Sale date
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    min={purchaseDateOnly}
                    className="h-9 text-[13px]"
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
                {saleBeforePurchase ? (
                  <p className="text-[11px] text-destructive">
                    Sale date can&rsquo;t be before purchase date.
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-medium text-muted-foreground">
                  Buyer name
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
        </div>

        <div className="rounded-lg border border-border/70 bg-card/40 p-3.5">
          <p className="text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
            Profit preview
          </p>
          <dl className="mt-2 space-y-1.5 text-[12.5px]">
            <Row
              label="Sale price"
              value={
                profitInfo
                  ? formatMoney(numericSalePrice ?? 0)
                  : "—"
              }
            />
            <Row
              label="Purchase price"
              value={formatMoney(vehicle.purchasePrice)}
            />
            <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
              <dt className="text-[12.5px] font-medium text-foreground">
                {profitInfo && !profitInfo.isProfit ? "Loss" : "Profit"}
              </dt>
              <dd
                className={cn(
                  "text-[14px] font-semibold tabular-nums",
                  profitInfo == null
                    ? "text-muted-foreground"
                    : profitInfo.isProfit
                    ? "text-primary"
                    : "text-destructive"
                )}
              >
                {profitInfo ? profitInfo.formatted : "—"}
              </dd>
            </div>
            <Row
              label="Margin"
              value={
                profitInfo
                  ? `${profitInfo.margin.toFixed(1)}%`
                  : "—"
              }
              valueClassName={cn(
                profitInfo == null
                  ? "text-muted-foreground"
                  : profitInfo.isProfit
                  ? "text-primary"
                  : "text-destructive"
              )}
            />
          </dl>
        </div>

        {submitError ? (
          <p className="text-[11.5px] text-destructive">{submitError}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="submit" disabled={pending} className="h-9 text-[13px]">
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              `Mark as Sold & Free Up ${formatMoney(vehicle.advanceAmount)}`
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", valueClassName)}>{value}</dd>
    </div>
  )
}
