import ExcursionForm from "@/components/ExcursionForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewExcursionPage() {
  return (
    <div>
      <PageHeader title="New excursion" />
      <ExcursionForm />
    </div>
  );
}
