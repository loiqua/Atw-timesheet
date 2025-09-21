import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-6">
      <div className="w-full max-w-md text-center rounded-2xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl p-8">
        <div className="flex flex-col items-center gap-2">
          <Image src="/Logo ATW Humanitae.png" alt="ATW Humanitae" width={72} height={72} className="rounded-full" />
          <h1 className="text-2xl font-semibold">ATW TimeSheet</h1>
          <p className="text-sm text-gray-500">Bienvenue</p>
        </div>
        <div className="mt-6 grid gap-3">
          <a href="/auth/login" className="w-full rounded-md bg-blue-600 text-white py-2.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Se connecter</a>
          <a href="/auth/register" className="w-full rounded-md border border-blue-600 text-blue-700 py-2.5 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Créer un compte</a>
        </div>
      </div>
    </div>
  );
}
