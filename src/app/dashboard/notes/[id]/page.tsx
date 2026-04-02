export default function NotesDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-4">

      <h1 className="text-2xl font-semibold">
        Detail Notes #{params.id}
      </h1>

      <p>
        Ini nanti isi detail notes (kita tunggu kamu kirim designnya)
      </p>

    </div>
  )
}