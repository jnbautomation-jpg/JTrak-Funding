"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function AccountPanel({ email }: { email: string }) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function changePassword() {
    setError(null)
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (error) {
      setError(error.message)
      toast.error("Could not update password", { description: error.message })
      return
    }
    toast.success("Password updated")
    setPassword("")
    setConfirm("")
    setEditing(false)
  }

  async function logOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Sign out failed", { description: error.message })
      return
    }
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="space-y-5 rounded-lg border border-border/70 bg-card/60 p-5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[12px] font-medium text-muted-foreground">
          Email
        </Label>
        <Input
          value={email}
          readOnly
          className="h-9 text-[13px] bg-muted/30 cursor-not-allowed"
        />
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">
              New password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="h-9 text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">
              Confirm password
            </Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="h-9 text-[13px]"
            />
          </div>
          {error ? (
            <p className="text-[11.5px] text-destructive">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false)
                setError(null)
                setPassword("")
                setConfirm("")
              }}
              disabled={pending}
              className="h-8 text-[12.5px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={changePassword}
              disabled={pending}
              className="h-8 text-[12.5px]"
            >
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-medium">Password</span>
            <span className="text-[11.5px] text-muted-foreground">
              Set a new password for your account.
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-8 text-[12.5px]"
          >
            <KeyRound className="size-3.5" />
            Change password
          </Button>
        </div>
      )}

      <div className="border-t border-border/60 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] font-medium">Sign out</span>
          <span className="text-[11.5px] text-muted-foreground">
            End your session on this device.
          </span>
        </div>
        <Button
          variant="destructive"
          onClick={logOut}
          className="h-8 text-[12.5px]"
        >
          <LogOut className="size-3.5" />
          Log out
        </Button>
      </div>
    </div>
  )
}
