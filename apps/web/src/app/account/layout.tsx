// Pass-through layout. Mirrors the /admin route group's structure — without
// it, Vercel's build failed to package the nested /account/orders lambda
// even though `next build` itself succeeded (a builder-side route-tracing
// quirk, not an app bug).
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
