export type Role = "MDM" | "APPC" | "APPG" | "BR" | "DEV" | "SUPERADMIN" | "SH-APPS" | "SH-APPC" | "SH-MDM" | "SH-BR"

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

  "SH-MDM": [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Coda Backlog", path: "/dashboard/mdm-sh" },
        { name: "Logix",        path: "/dashboard/mdm-sh" },
        { name: "Spreadsheets", path: "/dashboard/mdm-sh" },
      ],
    },
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

  "SH-APPS": [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Coda", path: "/dashboard/apps/coda" },
        { name: "Logix", path: "/dashboard/apps/logix" },
      ],
    },
  ],

  "SH-APPC": [
    {
      title: "Monitoring KPI",
      children: [
        { name: "Coda", path: "/dashboard/apps/coda" },
        { name: "Logix", path: "/dashboard/apps/logix" },
      ],
    },
  ],

  APPG: [],
  BR: [],
  DEV: [],

  SUPERADMIN: [
    {
      title: "Upload Data",
      children: [
        { name: "DT Transfer", path: "/superadmin" },
        { name: "Own Cloud", path: "/superadmin" },
        { name: "Monitoring WF", path: "/superadmin" },
        { name: "Coda", path: "/superadmin" },
        { name: "Logix", path: "/superadmin" },
      ],
    },
  ],
}
