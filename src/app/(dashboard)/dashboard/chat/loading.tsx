export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Assistants sidebar */}
      <div className="w-64 shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="p-2 space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 animate-pulse">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-24 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-12 animate-pulse rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
