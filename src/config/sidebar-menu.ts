export type Role = "MDM" | "APPC" | "APPT" | "APPG" | "BR" | "DEV"

export const sidebarMenu: Record<
  Role,
  {
    title: string
    children: { name: string; path: string }[]
  }[]
> = {
  MDM: [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Excel", path: "/dashboard/mdm/excel" },
        { name: "Coda", path: "/dashboard/mdm/coda" },
      ],
    },
  ],

  APPC: [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Coda", path: "/dashboard/appc/coda" },
        { name: "Logix", path: "/dashboard/appc/logix" },
        { name: "Docusaurus", path: "/dashboard/appc/docusaurus" },
        { name: "WSS", path: "/dashboard/appc/wss" },
      ],
    },
  ],

  APPT: [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Coda", path: "/dashboard/appt/coda" },
        { name: "Logix", path: "/dashboard/appt/logix" },
      ],
    },
  ],

  APPG: [],
  BR: [],
  DEV: [],
}