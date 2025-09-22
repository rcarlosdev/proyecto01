// interface Props {
//   children: React.ReactNode
// }

// function layout({ children }: Props) {
//   return (
//     <div className="bg-muted flex min-h-screen items-center justify-center p-6 md:p-10">
//       <div className="w-full max-w-sm md:max-w-3xl">
//         {children}
//       </div>
//     </div>
//   )
// }

// export default layout
// src/app/(auth)/layout.tsx

// v_ 20/209/2025
// export default function AuthLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="es">
//       <body>
//         <main className="flex items-center flex-col justify-center min-h-screen">
//           {children}
//         </main>
//       </body>
//     </html>
//   );
// }

// src/app/(auth)/sign-in/layout.tsx
import HeaderPublic from "@/components/layout/header-public";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderPublic />
      <main className="flex-1">{children}</main>
    </div>
  );
}



