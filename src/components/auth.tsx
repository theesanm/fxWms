'use client';

import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import ClientLayout from "@/app/client-layout";

export function Auth({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuthStore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    if (!user && !isLoading) {
        return <ClientLayout><LoginForm /></ClientLayout>;
    }

    return <ClientLayout>{children}</ClientLayout>;
}


