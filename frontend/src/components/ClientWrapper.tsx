'use client';

import { useEffect, useState } from 'react';

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Remove any attributes that might be added by browser extensions
    document.body.removeAttribute('cz-shortcut-listen');
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
} 