import Link from 'next/link';

export default function Header() {
  return (
    /* lg:hidden hace que el header desaparezca en computadoras */
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 sticky top-0 z-40 w-full lg:hidden">
      <div className="flex items-center justify-center w-full gap-2 p-1">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img 
            src="https://www.whirlpoolcorp.com/content/dam/business-unit/whirlpoolcorp/wp-content/upload/logos/2021_Whirlpool_Corp_2C_Black_RGB.png" 
            alt="Whirlpool Logo" 
            className="h-10 w-auto object-contain" 
          />
        </Link>
      </div>
    </header>
  );
}