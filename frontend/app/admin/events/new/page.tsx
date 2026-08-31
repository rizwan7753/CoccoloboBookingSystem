import EventForm from "@/components/EventForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader title="New event" description="Save first, then add ticket tiers on the next screen." />
      <EventForm />
    </div>
  );
}
