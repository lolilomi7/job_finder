export default function App() {
  return (
    <div className="w-80 min-h-96 bg-white p-5 flex flex-col gap-4">
      <header className="border-b border-gray-100 pb-3">
        <h1 className="text-lg font-bold text-blue-700 tracking-tight">
          Apply Co-Pilot
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Your job-application assistant</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-2xl">&#128196;</span>
        </div>
        <p className="text-sm text-gray-600 max-w-52">
          Get started by uploading your CV in{' '}
          <span className="font-medium text-blue-600">Settings</span>.
        </p>
      </div>

      <footer className="border-t border-gray-100 pt-3">
        <button
          className="w-full text-xs text-gray-400 hover:text-blue-600 transition-colors"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Open Settings
        </button>
      </footer>
    </div>
  )
}
