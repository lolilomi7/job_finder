export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">
            Apply Co-Pilot
          </h1>
          <p className="text-sm text-gray-500 mt-1">Settings</p>
        </header>

        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-800">CV &amp; API Key</h2>
          <p className="text-sm text-gray-500">
            Configuration options will appear here in Phase 1.
          </p>
        </div>
      </div>
    </div>
  )
}
