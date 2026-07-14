"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/stores/useStore";

const publicPaths = ["/login", "/onboarding", "/admin"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const onboarded = useStore((s) => s.user.onboarded);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (hydrated && !onboarded && !isPublic) {
      router.replace("/login");
    }
  }, [hydrated, onboarded, isPublic, router]);

  if (!hydrated) return null;

  if (!onboarded && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
