export default function TaskPanel() {
  return (
    <div className="bg-white p-4 rounded-2xl border space-y-4">

      <div className="flex justify-between">
        <h3 className="font-semibold">My Task</h3>
        <span className="text-green-500 text-sm">See All</span>
      </div>

      <div className="space-y-3">

        <div className="border p-3 rounded-xl">
          <p className="font-medium text-sm">IBP CI</p>
          <p className="text-xs text-gray-500">
            Integrasi data MOA/SAP ke SNOPIX
          </p>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
            Review BR
          </span>
        </div>

        <div className="border p-3 rounded-xl">
          <p className="font-medium text-sm">Permintaan Master Barang</p>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
            Open
          </span>
        </div>

      </div>

    </div>
  )
}