import MedicationAlertNotifier from "@/components/dashboard/MedicationAlertNotifier";
import SystemNotificationNotifier from "@/components/dashboard/SystemNotificationNotifier";

export default function DashboardAlertsLayer() {
  return (
    <>
      <SystemNotificationNotifier />
      <MedicationAlertNotifier />
    </>
  );
}
