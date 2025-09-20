import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center px-4">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mt-2 mb-4">
        Page non trouvée
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link href="/dashboard">Retourner au tableau de bord</Link>
      </Button>
    </div>
  );
}
