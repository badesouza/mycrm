'use client';

import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex-1 p-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-10 flex items-center justify-center">
        <Image src="/logo.png" alt="Gesfood CRM" width={200} height={200} priority />
      </div>
    </div>
  );
}


