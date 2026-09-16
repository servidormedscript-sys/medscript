import PageShell from "@/components/dashboard/PageShell";
import ShiftScheduleApp from "@/components/dashboard/agenda/ShiftScheduleApp";
import { requireSessionProfile, isAdmin } from "@/lib/auth/get-session-profile";

export default async function AgendaPage() {
  const { profile } = await requireSessionProfile();

  return (
    <PageShell
      title="Agenda de Plantões"
      description={
        isAdmin(profile)
          ? "Agende plantões por sub-usuário, data e horário. Cada agendamento notifica o profissional."
          : "Acompanhe seus plantões agendados pela administração da clínica."
      }
    >
      <ShiftScheduleApp isAdmin={isAdmin(profile)} />
    </PageShell>
  );
}
