type Props = {
  id: number
  title: string
  author: string
}

export default function NotesCard({ title, author }: Props) {
  return (
    <div className="border rounded-xl p-4 hover:shadow cursor-pointer transition">

      {/* TAG */}
      <div className="flex gap-2 mb-2">
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded">
          SFA Gamification
        </span>
        <span className="bg-blue-100 text-blue-600 px-2 py-1 text-xs rounded">
          Lokal
        </span>
      </div>

      {/* TITLE */}
      <h3 className="font-semibold text-lg">
        {title}
      </h3>

      <p className="text-sm text-gray-500">
        Lorem Ipsum
      </p>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>{author}</span>
        <span>Seen by ...</span>
      </div>

    </div>
  )
}