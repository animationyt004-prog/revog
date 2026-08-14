"use client";

import type { ComponentProps } from "react";
import { pixelTrack } from "@/lib/pixel";

type ContactLinkProps = ComponentProps<"a"> & {
  method: "email" | "phone" | "whatsapp";
};

export function MetaContactLink({ method, onClick, ...props }: ContactLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          pixelTrack("Contact", { contact_method: method });
        }
      }}
    />
  );
}
