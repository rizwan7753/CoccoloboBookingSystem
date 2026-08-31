"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { Excursion } from "@/lib/api";
import ExcursionForm from "@/components/ExcursionForm";
import { PageHeader } from "@/components/admin/ui";

export default function EditExcursionPage() {
  const { id } = useParams<{ id: string }>();
  const [excursion, setExcursion] = useState<Excursion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getExcursion(id)
      .then(setExcursion)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>;
  if (!excursion) return <p className="text-sm text-red-600">Excursion not found.</p>;

  return (
    <div>
      <PageHeader title="Edit excursion" />
      <ExcursionForm initial={excursion} />
    </div>
  );
}
