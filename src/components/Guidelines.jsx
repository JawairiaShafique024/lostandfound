import React from 'react'

const Guidelines = () => {
  return (
    <section id="guidelines" className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Getting Started</h2>
          <p className="text-gray-300">Login or signup is required to report an item and connect with the person who finds it.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-gray-200">
            <h3 className="text-xl font-semibold mb-3">Report Flow</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Create a Lost or Found report with clear details and photos.</li>
              <li>If you’re at the exact place, you can turn on location for accuracy.</li>
              <li>We monitor and match reports; relevant users can reach you via secure in‑app chat.</li>
              <li>When someone responds or a match is found, you’ll receive an email and an in‑app notification. Coordinate a safe handover.</li>
            </ol>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-gray-200">
            <h3 className="text-xl font-semibold mb-3">Tips for a Great Report</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Use a clear title (e.g., “Black Wallet with Gold Logo”).</li>
              <li>Mention date/time and nearest landmark for context.</li>
              <li>Upload sharp photos; avoid showing personal documents.</li>
              <li>Keep communication within the app for safety.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Guidelines


