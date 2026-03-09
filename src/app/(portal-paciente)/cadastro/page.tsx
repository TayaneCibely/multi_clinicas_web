"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { AxiosError } from "axios";
import { CheckCircle2 } from "lucide-react";

interface ApiErrorResponse {
  error?: string;
  message?: string;
  details?: Record<string, string>;
}

const unmask = (val: string) => val.replace(/\D/g, "");

const isValidCPF = (cpfStr: string) => {
  const cpf = unmask(cpfStr);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const signupSchema = z.object({
  name: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido"),
  document: z.string().refine((val) => isValidCPF(val), "CPF inválido"),
  telefone: z.string().refine((val) => {
    const unmasked = unmask(val);
    return unmasked.length >= 10 && unmasked.length <= 11;
  }, "Telefone inválido (deve conter DDD + número)"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  cep: z.string().refine((val) => unmask(val).length === 8, "CEP inválido (exatamente 8 dígitos)"),
  logradouro: z.string().min(2, "Logradouro obrigatório"),
  numero: z.string().min(1, "Número obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Bairro obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().length(2, "Use a sigla do estado (Ex: SP)"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setErrorMsg(null);
    try {
      const payload = {
        nome: data.name,
        email: data.email,
        cpf: unmask(data.document),
        telefone: unmask(data.telefone),
        senhaHash: data.password,
        endereco: {
          cep: unmask(data.cep),
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado.toUpperCase(),
        }
      };

      await api.post("/pacientes", payload);
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        const responseData = error.response.data as ApiErrorResponse;
        const apiMessage = responseData.message || responseData.details?.cpf || "Erro ao realizar cadastro. Verifique os dados informados.";
        setErrorMsg(apiMessage);
      } else {
        setErrorMsg("Ocorreu um erro de conexão com o servidor.");
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 bg-surface-page pb-24 text-center">
        <div className="w-20 h-20 bg-status-success/10 text-status-success rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Cadastro Realizado!</h1>
        <p className="text-text-secondary mt-2 mb-8 max-w-md">
          Sua conta foi criada com sucesso. Agora você já pode fazer login para agendar suas consultas.
        </p>
        <Button onClick={() => window.location.href = '/login?registered=true'} className="w-full max-w-xs h-12">
          Ir para o Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[85vh] p-6 bg-surface-page pb-24">
      <div className="mt-8 mb-6 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Novo Cadastro</h1>
        <p className="text-sm text-text-secondary mt-2">Preencha os campos abaixo para criar seu perfil e agendar consultas.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-surface-card p-6 rounded-card border border-border-subtle shadow-card max-w-3xl w-full mx-auto">
        
        {errorMsg && (
          <div className="p-3 text-sm bg-status-error/10 text-status-error border border-status-error/20 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2 border-b border-border-subtle pb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="Ex: Maria Silva" {...register("name")} />
                {errors.name && <p className="text-xs text-status-error">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input id="document" placeholder="000.000.000-00" {...register("document")} />
                {errors.document && <p className="text-xs text-status-error">{errors.document.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
                {errors.email && <p className="text-xs text-status-error">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 99999-9999" {...register("telefone")} />
                {errors.telefone && <p className="text-xs text-status-error">{errors.telefone.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="******" {...register("password")} />
                {errors.password && <p className="text-xs text-status-error">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-text-primary mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" placeholder="00000-000" {...register("cep")} />
                {errors.cep && <p className="text-xs text-status-error">{errors.cep.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" placeholder="Rua, Avenida, etc" {...register("logradouro")} />
                {errors.logradouro && <p className="text-xs text-status-error">{errors.logradouro.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" placeholder="123" {...register("numero")} />
                {errors.numero && <p className="text-xs text-status-error">{errors.numero.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="complemento">Complemento <span className="text-text-muted font-normal">(Opcional)</span></Label>
                <Input id="complemento" placeholder="Apto, Bloco, etc" {...register("complemento")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" placeholder="Centro" {...register("bairro")} />
                {errors.bairro && <p className="text-xs text-status-error">{errors.bairro.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" placeholder="São Paulo" {...register("cidade")} />
                {errors.cidade && <p className="text-xs text-status-error">{errors.cidade.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input id="estado" placeholder="SP" maxLength={2} className="uppercase" {...register("estado")} />
                {errors.estado && <p className="text-xs text-status-error">{errors.estado.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 mt-8" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Concluir Cadastro"}
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-text-secondary">
            Já possui uma conta?{' '}
            <Link href={`/login`} className="text-accent-primary font-bold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}