"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AddTransactionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    const payload = {
      type,
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
      pricePerUnit: formData.get("pricePerUnit"),
      currency: formData.get("currency"),
      transactionDate: formData.get("transactionDate"),
      notes: formData.get("notes") || undefined,
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    setSubmitting(false);

    if (!res.ok || "error" in body) {
      setError(body.error?.message ?? "Something went wrong");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add transaction
          </Button>
        }
      />
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell against your gold holdings.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-6 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {(["buy", "sell"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={cn(
                  "rounded-sm border py-2 text-[13.5px] font-medium capitalize transition-colors",
                  type === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.0001"
                min="0"
                required
                className="flex-1"
              />
              <Select name="unit" defaultValue="chi" required>
                <SelectTrigger id="unit" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chi">Chi</SelectItem>
                  <SelectItem value="damlung">Damlung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pricePerUnit">Price per unit</Label>
            <div className="flex gap-2">
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                step="0.0001"
                min="0"
                required
                className="flex-1"
              />
              <Select name="currency" defaultValue="USD" required>
                <SelectTrigger id="currency" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KHR">KHR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="transactionDate">Date</Label>
            <Input
              id="transactionDate"
              name="transactionDate"
              type="date"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-muted-foreground">
              Notes (optional)
            </Label>
            <Input id="notes" name="notes" />
          </div>

          {error && <p className="text-[12.5px] text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Save transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
