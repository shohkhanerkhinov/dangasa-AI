'use client';

import React from 'react';

export default function OAuthMockPage() {
  return (
    <div className="min-h-screen bg-[#020205] text-white flex flex-col justify-center items-center p-6 font-sans text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border border-purple-500/20 bg-purple-950/10 backdrop-blur-xl">
        <h1 className="text-2xl font-black text-rose-500 mb-4">Firebase Sozlanmagan</h1>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          Siz haqiqiy Google/GitHub tizimiga kirishni ishlatmoqchisiz. 
          Buning uchun loyihaning ildiz papkasidagi <code className="bg-purple-900/30 px-1.5 py-0.5 rounded text-purple-300">.env.local</code> fayliga o'zingizning haqiqiy Firebase kalitlaringizni yozishingiz kerak.
        </p>
        <div className="text-left text-xs bg-black/40 p-4 rounded-xl font-mono text-gray-400 mb-6 border border-gray-800">
          <div>NEXT_PUBLIC_FIREBASE_API_KEY=...</div>
          <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...</div>
          <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID=...</div>
        </div>
        <p className="text-xs text-gray-400">
          Kalitlarni kiritgandan so'ng, Next.js dev-serverni (terminalda) qayta ishga tushirishni (restart) unutmang!
        </p>
      </div>
    </div>
  );
}
