// src/app/api/usuarios/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// ✅ GET /api/usuarios/[id]
// Obtiene la información completa de un usuario por su ID
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioId = params.id;

    const result = await db
      .select()
      .from(user)
      .where(eq(user.id, usuarioId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const usuario = result[0];
    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ✅ PUT /api/usuarios/[id]
// Actualiza los datos de un usuario (solo campos válidos)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioId = params.id;
    const body = await request.json();

    // Campos permitidos para actualización
    const {
      name,
      email,
      status,
      role,
      preferences,
      balance,
      image,
      emailVerified,
    } = body;

    // Construimos un objeto limpio (solo con los campos presentes)
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (preferences) updateData.preferences = preferences;
    if (balance) updateData.balance = balance;
    if (image) updateData.image = image;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    // Si no hay datos para actualizar, devolvemos error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    // Actualizamos el usuario
    const updated = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, usuarioId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
