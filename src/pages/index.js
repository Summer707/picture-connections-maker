import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Summer&apos;s Connections
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-900 max-w-2xl mx-auto">
            Create and share your own picture connection puzzles. Challenge your friends to find the hidden groups!
          </p>

          <div className="pt-8">
            <Link 
              href="/create"
              className="inline-block px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Create New Puzzle
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Find the Groups</h3>
              <p className="text-gray-900">lock in.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Create Your Own</h3>
              <p className="text-gray-900">you&apos;re welcome.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Share & Play</h3>
              <p className="text-gray-900">pls i want the extra credit</p>  
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
        Made with Love ❌ Made with AI ✅
      </div>
    </div>
  );
}
