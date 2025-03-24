import { RegisterForm } from '@/components/auth';

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                    <RegisterForm />
                </div>
            </main>
        </div>
    );
}