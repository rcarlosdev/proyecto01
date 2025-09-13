"use client";

import { useState } from "react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { OctagonAlertIcon } from "lucide-react";

import GoogleIcon from "@/../public/icons/google-icon";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio.").email("Introduce un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "La contraseña debe tener al menos una letra mayúscula.")
    .regex(/[a-z]/, "La contraseña debe tener al menos una letra minúscula.")
    .regex(/[0-9]/, "La contraseña debe tener al menos un número.")
    .regex(/[^A-Za-z0-9]/, "La contraseña debe tener al menos un carácter especial."),
});

export const SingInView = () => {
  // const { data: session } = authClient.useSession();

  const route = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const translateErrorMessage = (message: string) => {
    const translations: Record<string, string> = {
      "Invalid email or password": "Credenciales de inicio de sesión inválidas.",
      "User not found": "Usuario no encontrado",
      "Email not verified": "Correo no verificado",
      "Too many requests": "Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.",
    };
    return translations[message] || message;
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setLoading(true);
    authClient.signIn.email(
      {
        email: data.email,
        password: data.password
      },
      {
        onSuccess: () => {
          setLoading(false);
          route.push("/");
        },
        onError: ({ error }) => {
          setLoading(false);
          // traducir el mensaje de error
          const translatedError = translateErrorMessage(error.message);
          setError(translatedError || "Ocurrió un error, por favor intente nuevamente.");
        },
      }
    )
  }

  const handleGoogleSignin = () => {
    setLoading(true);
    authClient.signIn.social(
      {
        provider: "google"
      },
      {
        onSuccess: () => {
          setLoading(false);
          route.push("/");
        },
        onError: () => {
          setLoading(false);
          setError("Ocurrió un error, por favor intente nuevamente.");
        },
      }
    );
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 md:p-10">
          <h1 className="mb-2 text-2xl font-bold ">Bienvenido!</h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para acceder a todas las funcionalidades de la aplicación.
          </p>
          <Form {...form}>
            <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="m@ejemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 cursor-pointer"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? "Ocultar" : "Mostrar"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!!error && (
                <Alert className="bg-destructive/10 border-none text-red-600">
                  <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
                  <AlertTitle className="select-none">{error}</AlertTitle>
                </Alert>
              )}
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </Button>

              {/* Divider */}
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  O continúa con
                </span>
              </div>

              {/* Social login */}
              <Button
                type="button"
                className="w-full flex items-center justify-center cursor-pointer"
                variant="outline"
                onClick={handleGoogleSignin}
                disabled={loading}
                aria-label="Iniciar sesión con Google"
              >
                <GoogleIcon />
                Iniciar sesión con Google
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline:offset-4 mt-5">
        Al hacer clic en continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y nuestra <a href="#">Política de Privacidad</a>.
      </div>
    </>
  );
}
