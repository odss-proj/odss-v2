import DashboardPage from "../../../components/dashboard/dashboard-page"
import { dashboardConfig } from "../../../config/dashboard-config"

export default function Page() {
  return <DashboardPage config={dashboardConfig.appc} />
}