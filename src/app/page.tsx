import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
    return (
        <div className="fade-in text-center py-8 home-hero">
            <h1 className="mb-6">Athletic Club</h1>
            <p className="text-muted text-lg mb-8 hero-copy">
                Profesjonalny system zarządzania klubem sportowym.
                Monitoruj wejścia, sprzedaż i bazę klubowiczów w czasie rzeczywistym.
            </p>
            <div className="flex gap-4 justify-center">
                <Link href="/dashboard">
                    <Button size="lg">Przejdź do Panelu</Button>
                </Link>
            </div>
        </div>
    );
}
