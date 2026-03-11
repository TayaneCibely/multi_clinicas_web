"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AxiosError } from "axios";
import { Loader2, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import api from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

// JWT Decode type helper (simplified)
function parseJwt(token: string) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
}

const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { setAuthData } = useAuthStore();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", senha: "" },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        setErrorMsg(null);

        try {
            // Faz o login diretamente usando a API, não enviando X-Clinic-ID aqui,
            // a menos que o Axios global intercepte, então pode enviar (mas o Back-end aceita).
            const response = await api.post("/auth/login", {
                email: data.email,
                senha: data.senha,
            });

            const { token, id, nome, role } = response.data;

            // Update global store com User e Token (ignoramos o tenant por enquanto, já que é SUPER_ADMIN)
            setAuthData(
                { id: String(id), name: nome, email: data.email, role: role },
                token
            );

            // Redireciona para o Master Dashboard
            router.push("/admin/clinicas");
        } catch (error) {
            if (
                error instanceof AxiosError &&
                (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 400)
            ) {
                setErrorMsg("E-mail ou senha incorretos.");
            } else {
                setErrorMsg("Ocorreu um erro ao conectar com o servidor.");
            }
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-card rounded-panel shadow-float border border-border-subtle p-8 overflow-hidden relative">
                {/* Glow Effects */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary opacity-80" />
                <div className="absolute -left-16 -top-16 w-32 h-32 bg-accent-primary/5 blur-3xl rounded-full" />
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-accent-secondary/5 blur-3xl rounded-full" />

                <div className="text-center mb-8 relative">
                    <div className="mb-4 flex justify-center">
                        <BrandLogo size={60} withText={false} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
                        MultiClínicas Master
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Digite suas credenciais de Super Administrador para acessar a gestão de clinicas
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-text-primary text-sm font-medium">E-mail</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="admin@multiclinicas.com"
                                            type="email"
                                            className="bg-surface-page"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-status-error text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="senha"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-text-primary text-sm font-medium">Senha</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-surface-page"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-status-error text-xs" />
                                </FormItem>
                            )}
                        />

                        {errorMsg && (
                            <div className="p-3 text-sm bg-status-error/10 text-status-error border border-status-error/20 rounded-lg">
                                {errorMsg}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full relative shadow-btn-glow"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Autenticando..." : "Entrar no Sistema"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
