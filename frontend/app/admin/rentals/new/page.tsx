import RentalItemForm from "@/components/RentalItemForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewRentalPage() {
  return (
    <div>
      <PageHeader title="New rental item" description="Save first, then add numbered spots on the next screen." />
      <RentalItemForm />
    </div>
  );
}
