"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { AccountTabs } from "@/components/account/account-tabs";
import {
  AccountSessionLoading,
  useAccountSession,
} from "@/components/account/account-session";
import { Navbar } from "@/components/layout/navbar";
import { PromoTicker } from "@/components/layout/promo-ticker";
import { authedFetch } from "@/lib/auth-store";
import { cn } from "@/lib/format";
import type { AddressData } from "@/lib/types";

type AddressType = AddressData["type"];

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  type: "HOME",
  isDefault: false,
};

const FIELDS: {
  key: keyof Pick<
    AddressForm,
    "fullName" | "phone" | "line1" | "line2" | "city" | "state" | "pincode"
  >;
  label: string;
  placeholder: string;
  span?: boolean;
  maxLength: number;
  inputMode?: "text" | "numeric" | "tel";
}[] = [
  {
    key: "fullName",
    label: "Full name",
    placeholder: "Name on the delivery",
    span: true,
    maxLength: 80,
  },
  {
    key: "phone",
    label: "Mobile number",
    placeholder: "10-digit mobile number",
    maxLength: 10,
    inputMode: "tel",
  },
  {
    key: "pincode",
    label: "Pincode",
    placeholder: "6-digit pincode",
    maxLength: 6,
    inputMode: "numeric",
  },
  {
    key: "line1",
    label: "Address",
    placeholder: "House number, building and street",
    span: true,
    maxLength: 120,
  },
  {
    key: "line2",
    label: "Landmark (optional)",
    placeholder: "Area or nearby landmark",
    span: true,
    maxLength: 120,
  },
  {
    key: "city",
    label: "City",
    placeholder: "City",
    maxLength: 60,
  },
  {
    key: "state",
    label: "State",
    placeholder: "State",
    maxLength: 60,
  },
];

async function responseMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? fallback;
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

function toForm(address: AddressData): AddressForm {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    type: address.type,
    isDefault: address.isDefault,
  };
}

function validateAddress(form: AddressForm) {
  if (form.fullName.trim().length < 2)
    return "Enter the recipient's full name.";
  if (!/^[6-9]\d{9}$/.test(form.phone))
    return "Enter a valid 10-digit mobile number.";
  if (form.line1.trim().length < 3)
    return "Enter the complete delivery address.";
  if (form.city.trim().length < 2) return "Enter the city.";
  if (form.state.trim().length < 2) return "Enter the state.";
  if (!/^\d{6}$/.test(form.pincode)) return "Enter a valid 6-digit pincode.";
  return null;
}

export function AddressesView() {
  const { ready, status, user } = useAccountSession("/account/addresses");
  const [addresses, setAddresses] = useState<AddressData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoadError(null);
    setAddresses(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await authedFetch("/addresses", {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(
          await responseMessage(response, "Could not load saved addresses."),
        );
      }
      setAddresses((await response.json()) as AddressData[]);
    } catch (cause) {
      setAddresses([]);
      setLoadError(
        cause instanceof Error && cause.name !== "AbortError"
          ? cause.message
          : "Address details took too long to load.",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (status === "authed") void loadAddresses();
  }, [loadAddresses, status]);

  function openNewAddress() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      fullName: user?.name ?? "",
      phone: user?.phone ?? "",
      isDefault: addresses?.length === 0,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function openEditAddress(address: AddressData) {
    setEditingId(address.id);
    setForm(toForm(address));
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function saveAddress() {
    const error = validateAddress(form);
    if (error) {
      setFormError(error);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        fullName: form.fullName.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        isDefault: form.isDefault || addresses?.length === 0,
      };
      const response = await authedFetch(
        editingId ? `/addresses/${editingId}` : "/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(
          await responseMessage(response, "Could not save this address."),
        );
      }
      closeForm();
      await loadAddresses();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "Could not save this address.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(address: AddressData) {
    setSettingDefaultId(address.id);
    setLoadError(null);
    try {
      const response = await authedFetch(`/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toForm(address), isDefault: true }),
      });
      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
            "Could not update the default address.",
          ),
        );
      }
      await loadAddresses();
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Could not update the default address.",
      );
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function deleteAddress(id: string) {
    setDeletingId(id);
    setLoadError(null);
    try {
      const response = await authedFetch(`/addresses/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          await responseMessage(response, "Could not remove this address."),
        );
      }
      setConfirmDeleteId(null);
      await loadAddresses();
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Could not remove this address.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready || !user) {
    return <AccountSessionLoading nextPath="/account/addresses" />;
  }

  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="flex-1 bg-ink">
        <section className="border-b border-paper/10 bg-night text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
            <p className="text-xs font-semibold uppercase text-white/55">
              Delivery details
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="display text-4xl sm:text-5xl">
                  Saved addresses<span className="text-volt">.</span>
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                  Keep your preferred delivery details ready for checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewAddress}
                className="flex h-11 items-center gap-2 bg-volt px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-night"
              >
                <Plus size={17} /> Add address
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <AccountTabs />

          {formOpen && (
            <section
              aria-labelledby="address-form-title"
              className="border-b border-paper/10 py-8 sm:py-10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-volt">
                    {editingId ? "Update details" : "New delivery address"}
                  </p>
                  <h2 id="address-form-title" className="display mt-1 text-3xl">
                    {editingId ? "Edit address" : "Add an address"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close address form"
                  title="Close"
                  className="grid h-10 w-10 place-items-center border border-paper/15 text-paper-dim hover:border-paper/40 hover:text-paper"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className={cn("block", field.span && "sm:col-span-2")}
                  >
                    <span className="mb-1.5 block text-xs font-semibold text-paper-dim">
                      {field.label}
                    </span>
                    <input
                      value={form[field.key]}
                      inputMode={field.inputMode}
                      autoComplete={
                        field.key === "fullName"
                          ? "name"
                          : field.key === "phone"
                            ? "tel"
                            : field.key === "pincode"
                              ? "postal-code"
                              : field.key === "city"
                                ? "address-level2"
                                : field.key === "state"
                                  ? "address-level1"
                                  : field.key === "line1"
                                    ? "address-line1"
                                    : "address-line2"
                      }
                      maxLength={field.maxLength}
                      placeholder={field.placeholder}
                      onChange={(event) => {
                        const value =
                          field.key === "phone" || field.key === "pincode"
                            ? event.target.value.replace(/\D/g, "")
                            : event.target.value;
                        setForm((current) => ({
                          ...current,
                          [field.key]: value,
                        }));
                        setFormError(null);
                      }}
                      className="h-12 w-full border border-paper/20 bg-white px-3 text-sm outline-none transition-colors placeholder:text-paper-dim/60 focus:border-volt"
                    />
                  </label>
                ))}
              </div>

              <fieldset className="mt-5">
                <legend className="text-xs font-semibold text-paper-dim">
                  Address type
                </legend>
                <div className="mt-2 inline-flex border border-paper/15 bg-ink-2 p-1">
                  {(["HOME", "WORK", "OTHER"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, type }))
                      }
                      className={cn(
                        "h-9 px-4 text-xs font-semibold transition-colors",
                        form.type === type
                          ? "bg-paper text-ink"
                          : "text-paper-dim hover:text-paper",
                      )}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 flex w-fit cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isDefault: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-volt"
                />
                Use as default delivery address
              </label>

              {formError && (
                <p className="mt-4 text-sm text-blood" role="alert">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void saveAddress()}
                  disabled={saving}
                  className="flex h-11 items-center gap-2 bg-volt px-5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  {editingId ? "Save changes" : "Save address"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-11 border border-paper/20 px-5 text-sm font-semibold text-paper-dim hover:border-paper/50 hover:text-paper"
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {addresses === null ? (
            <div className="grid place-items-center py-24">
              <Loader2 size={27} className="animate-spin text-volt" />
            </div>
          ) : loadError && addresses.length === 0 ? (
            <div className="py-20 text-center">
              <MapPin
                size={42}
                strokeWidth={1.2}
                className="mx-auto text-paper-dim"
              />
              <p className="display mt-4 text-2xl">Addresses could not load.</p>
              <p
                className="mx-auto mt-2 max-w-md text-sm text-paper-dim"
                role="alert"
              >
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => void loadAddresses()}
                className="mt-5 inline-flex h-11 items-center gap-2 border border-paper/20 px-5 text-sm font-semibold hover:border-volt hover:text-volt"
              >
                <RotateCcw size={16} /> Try again
              </button>
            </div>
          ) : addresses.length === 0 ? (
            <div className="py-20 text-center">
              <MapPin
                size={44}
                strokeWidth={1.2}
                className="mx-auto text-paper-dim"
              />
              <p className="display mt-4 text-2xl">No saved addresses.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-paper-dim">
                Add a delivery address to make your next checkout faster.
              </p>
              {!formOpen && (
                <button
                  type="button"
                  onClick={openNewAddress}
                  className="mt-5 inline-flex h-11 items-center gap-2 bg-volt px-5 text-sm font-semibold text-white"
                >
                  <Plus size={17} /> Add first address
                </button>
              )}
            </div>
          ) : (
            <section className="py-9 sm:py-12">
              <div className="flex items-end justify-between gap-4 border-b border-paper/10 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-volt">
                    Address book
                  </p>
                  <h2 className="display mt-1 text-3xl">
                    {addresses.length} saved address
                    {addresses.length === 1 ? "" : "es"}
                  </h2>
                </div>
              </div>

              {loadError && (
                <p className="mt-4 text-sm text-blood" role="alert">
                  {loadError}
                </p>
              )}

              <div className="grid gap-px bg-paper/10 sm:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="flex min-h-64 flex-col bg-ink p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-10 w-10 place-items-center bg-ink-2 text-volt">
                        {address.type === "HOME" ? (
                          <Home size={18} />
                        ) : (
                          <MapPin size={18} />
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditAddress(address)}
                          aria-label={`Edit ${address.fullName}'s address`}
                          title="Edit address"
                          className="grid h-9 w-9 place-items-center text-paper-dim hover:bg-ink-2 hover:text-paper"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(address.id)}
                          aria-label={`Remove ${address.fullName}'s address`}
                          title="Remove address"
                          className="grid h-9 w-9 place-items-center text-paper-dim hover:bg-blood/10 hover:text-blood"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {address.fullName}
                        </h3>
                        <span className="border border-paper/15 px-2 py-0.5 text-[10px] font-semibold text-paper-dim">
                          {address.type}
                        </span>
                        {address.isDefault && (
                          <span className="bg-volt px-2 py-0.5 text-[10px] font-semibold text-white">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-paper-dim">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="mt-2 text-sm text-paper-dim">
                        +91 {address.phone}
                      </p>
                    </div>

                    <div className="mt-auto pt-5">
                      {confirmDeleteId === address.id ? (
                        <div className="flex flex-wrap items-center gap-2 border-t border-blood/20 pt-4">
                          <span className="mr-auto text-xs text-blood">
                            Remove this address?
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-9 px-3 text-xs font-semibold text-paper-dim hover:text-paper"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteAddress(address.id)}
                            disabled={deletingId === address.id}
                            className="flex h-9 items-center gap-1.5 bg-blood px-3 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {deletingId === address.id && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            Remove
                          </button>
                        </div>
                      ) : !address.isDefault ? (
                        <button
                          type="button"
                          onClick={() => void makeDefault(address)}
                          disabled={settingDefaultId === address.id}
                          className="flex h-9 items-center gap-2 text-xs font-semibold text-volt disabled:opacity-50"
                        >
                          {settingDefaultId === address.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Make default
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
