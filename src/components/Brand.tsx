import { Check } from 'lucide-react';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand ${inverse ? 'brand--inverse' : ''}`}>
      <span className="brand__mark"><Check size={19} strokeWidth={3} /></span>
      <span>taskflow</span>
    </div>
  );
}

